#!/usr/bin/env node
// 카카오페이지·리디에서 라이크노벨 유료연재 작품의 연재본을 headless 브라우저로 확인하고
// 관리자 sync API로 보낸다. 매칭과 노출 조건은 백엔드가 판단한다.
//
// 사용법:
//   node devtools/external-distribution/collect.mjs --api https://api.likenovel.dev \
//     --credentials-file output/local-credentials/likenovel-cms-admin.md [--platform all|kakaopage|ridi] [--dry-run]
// 환경변수 LN_ADMIN_EMAIL / LN_ADMIN_PASSWORD가 있으면 파일보다 우선한다.

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  SERIAL,
  dedupeObservations,
  isCandidateCovered,
  normalizeText,
  parseKakaoLabel,
  parseRidiCard,
  titleSimilarity,
} from "./parse.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const SEARCH_DELAY_MS = 800;
const RIDI_MAX_PAGES = 40;

const parseArgs = (argv) => {
  const args = { platform: "all", dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === "--dry-run") args.dryRun = true;
    else if (key === "--api") args.api = argv[++i];
    else if (key === "--platform") args.platform = argv[++i];
    else if (key === "--credentials-file") args.credentialsFile = argv[++i];
    else if (key === "--output") args.output = argv[++i];
    else throw new Error(`알 수 없는 인자: ${key}`);
  }
  if (!args.api) throw new Error("--api 가 필요합니다. 예: --api https://api.likenovel.dev");
  if (!["all", "kakaopage", "ridi"].includes(args.platform)) {
    throw new Error("--platform 은 all | kakaopage | ridi 중 하나입니다.");
  }
  args.api = args.api.replace(/\/+$/, "");
  return args;
};

const readCredentials = (file) => {
  const email = process.env.LN_ADMIN_EMAIL;
  const password = process.env.LN_ADMIN_PASSWORD;
  if (email && password) return { email, password };
  if (!file) throw new Error("LN_ADMIN_EMAIL/LN_ADMIN_PASSWORD 또는 --credentials-file 이 필요합니다.");
  const text = readFileSync(path.resolve(file), "utf8");
  const pick = (label) =>
    text.match(new RegExp(`^\\s*-\\s*${label}:\\s*\`?([^\`\\n]+?)\`?\\s*$`, "m"))?.[1]?.trim();
  const fileEmail = pick("Admin email");
  const filePassword = pick("Admin password");
  if (!fileEmail || !filePassword) throw new Error("자격 증명 파일에서 Admin email/password 줄을 찾지 못했습니다.");
  return { email: fileEmail, password: filePassword };
};

const apiRequest = async (api, token, method, route, body) => {
  const response = await fetch(`${api}${route}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.message || payload?.detail || response.statusText;
    throw new Error(`${method} ${route} 실패: HTTP ${response.status} ${JSON.stringify(message).slice(0, 200)}`);
  }
  return payload;
};

const login = async (api, { email, password }) => {
  const payload = await apiRequest(api, null, "POST", "/v1/command/admins/login", {
    email,
    password,
    keep_signin_yn: "N",
  });
  const token = payload?.data?.auth?.accessToken;
  if (!token) throw new Error("관리자 로그인 응답에 accessToken이 없습니다.");
  return token;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const searchKakao = async (page, keyword, { scroll }) => {
  await page.goto(`https://page.kakao.com/search/result?keyword=${encodeURIComponent(keyword)}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  const hasResult = await page
    .waitForSelector('a[href*="/content/"]', { timeout: 12000 })
    .then(() => true)
    .catch(() => false);
  if (!hasResult) {
    const bodyText = await page.evaluate(() => document.body?.innerText ?? "");
    if (!bodyText.includes("검색")) throw new Error(`카카오 검색 화면을 확인하지 못했습니다: ${keyword}`);
    return { observations: [], unparsed: 0 };
  }
  if (scroll) {
    let previous = -1;
    let stable = 0;
    for (let i = 0; i < 60 && stable < 3; i += 1) {
      const count = await page.evaluate(() => document.querySelectorAll('a[href*="/content/"]').length);
      stable = count === previous ? stable + 1 : 0;
      previous = count;
      await page.mouse.wheel(0, 4000);
      await sleep(1200);
    }
  }
  const items = await page.evaluate(() => {
    const byId = new Map();
    for (const anchor of document.querySelectorAll('a[href*="/content/"]')) {
      const id = (anchor.getAttribute("href").match(/content\/(\d+)/) || [])[1];
      const label = anchor.getAttribute("aria-label") || anchor.innerText || "";
      if (id && !byId.has(id)) byId.set(id, label);
    }
    return [...byId.entries()];
  });
  const observations = [];
  let unparsed = 0;
  for (const [id, label] of items) {
    const observation = parseKakaoLabel(id, label);
    if (observation) observations.push(observation);
    else if (/, 웹소설,/.test(label)) unparsed += 1;
  }
  return { observations, unparsed };
};

const extractRidiCards = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("li")]
      .filter((li) => li.querySelector('a[href^="/books/"]') && li.querySelector('a[href^="/author/"]'))
      .map((li) => {
        const titleAnchor = [...li.querySelectorAll('a[href^="/books/"]')].find(
          (a) => !a.querySelector("p") && !a.querySelector("img") && a.textContent.trim()
        );
        return {
          externalId: (li.querySelector('a[href^="/books/"]').getAttribute("href").match(/books\/(\d+)/) || [])[1],
          title: titleAnchor ? titleAnchor.textContent.trim() : "",
          authors: [...li.querySelectorAll('a[href^="/author/"]')].map((a) => a.textContent.trim()),
          publishers: [...li.querySelectorAll('a[href*="search?q="]')]
            .filter((a) => {
              try {
                return decodeURIComponent(a.getAttribute("href")).includes("출판사:");
              } catch {
                return false;
              }
            })
            .map((a) => a.textContent.trim()),
          countTexts: [...li.querySelectorAll("span")].map((s) => s.textContent.trim()).filter((t) => t.startsWith("총")),
        };
      })
  );

const searchRidi = async (page, query) => {
  await page.goto(`https://ridibooks.com/search?q=${encodeURIComponent(query)}`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForSelector('a[href^="/books/"]', { timeout: 10000 }).catch(() => null);
  const title = await page.title();
  if (!title.includes("리디")) throw new Error(`리디 검색 화면을 확인하지 못했습니다: ${query}`);
  return (await extractRidiCards(page)).map(parseRidiCard).filter(Boolean);
};

const collectKakao = async (page, candidates, minOpenEpisodes) => {
  const errors = [];
  const keyword = await searchKakao(page, "라이크노벨", { scroll: true });
  let unparsed = keyword.unparsed;
  const observations = keyword.observations.filter((obs) => obs.edition === SERIAL);
  const uncovered = candidates.filter(
    (c) => c.openEpisodeCount >= minOpenEpisodes && !isCandidateCovered(c, observations)
  );
  for (const candidate of uncovered) {
    await sleep(SEARCH_DELAY_MS);
    try {
      const result = await searchKakao(page, candidate.title, { scroll: false });
      unparsed += result.unparsed;
      observations.push(
        ...result.observations.filter(
          (obs) => obs.edition === SERIAL && normalizeText(obs.author) === normalizeText(candidate.authorName)
        )
      );
    } catch (error) {
      errors.push(String(error.message || error));
    }
  }
  return {
    observations: dedupeObservations(observations),
    keywordCount: keyword.observations.length,
    titleSearchCount: uncovered.length,
    unparsed,
    errors,
  };
};

const collectRidi = async (page, candidates, minOpenEpisodes, kakaoObservations) => {
  const errors = [];
  const observations = [];
  const seen = new Set();
  let pages = 0;
  for (let pageNo = 1; pageNo <= RIDI_MAX_PAGES; pageNo += 1) {
    await sleep(SEARCH_DELAY_MS);
    await page.goto(
      `https://ridibooks.com/search?q=${encodeURIComponent("출판사:라이크노벨")}&page=${pageNo}`,
      { waitUntil: "domcontentloaded", timeout: 30000 }
    );
    await page.waitForSelector('a[href^="/books/"]', { timeout: 10000 }).catch(() => null);
    const cards = (await extractRidiCards(page)).map(parseRidiCard).filter(Boolean);
    const fresh = cards.filter((card) => !seen.has(card.external_id));
    if (fresh.length === 0) break;
    pages = pageNo;
    for (const card of fresh) seen.add(card.external_id);
    observations.push(...fresh);
    if (pageNo === RIDI_MAX_PAGES) errors.push("리디 출판사 검색이 최대 페이지에 도달했습니다.");
  }
  const serial = observations.filter((obs) => obs.edition === SERIAL);
  const uncovered = candidates.filter(
    (c) => c.openEpisodeCount >= minOpenEpisodes && !isCandidateCovered(c, serial)
  );
  for (const candidate of uncovered) {
    const queries = [
      candidate.title,
      ...kakaoObservations
        .filter(
          (obs) =>
            normalizeText(obs.author) === normalizeText(candidate.authorName) &&
            titleSimilarity(obs.title, candidate.title) >= 0.6
        )
        .map((obs) => obs.title),
    ];
    for (const query of [...new Set(queries)]) {
      await sleep(SEARCH_DELAY_MS);
      try {
        const found = (await searchRidi(page, query)).filter(
          (obs) => obs.edition === SERIAL && normalizeText(obs.author) === normalizeText(candidate.authorName)
        );
        serial.push(...found);
        if (found.length > 0) break;
      } catch (error) {
        errors.push(String(error.message || error));
      }
    }
  }
  return {
    observations: dedupeObservations(serial),
    publisherPages: pages,
    publisherCount: observations.length,
    titleSearchCount: uncovered.length,
    unparsed: 0,
    errors,
  };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const token = await login(args.api, readCredentials(args.credentialsFile));
  const candidatePayload = await apiRequest(
    args.api,
    token,
    "GET",
    "/v1/query/admins/external-distributions/candidates"
  );
  const candidates = candidatePayload?.data ?? [];
  const platformConfig = candidatePayload?.platforms ?? {};
  console.log(`[external-distribution] 유료연재 후보 ${candidates.length}개`);

  const requireFromService = createRequire(path.join(REPO_ROOT, "service/package.json"));
  const { chromium } = requireFromService("playwright");
  const browser = await chromium.launch({ headless: true });
  const report = {};
  try {
    const context = await browser.newContext({ userAgent: USER_AGENT, locale: "ko-KR" });
    const page = await context.newPage();
    let kakaoObservations = [];
    if (args.platform !== "ridi") {
      const result = await collectKakao(page, candidates, platformConfig.kakaopage?.min_open_episodes ?? 50);
      kakaoObservations = result.observations;
      report.kakaopage = result;
    }
    if (args.platform !== "kakaopage") {
      report.ridi = await collectRidi(page, candidates, platformConfig.ridi?.min_open_episodes ?? 100, kakaoObservations);
    }
  } finally {
    await browser.close();
  }

  if (args.output) writeFileSync(path.resolve(args.output), JSON.stringify(report, null, 2));

  let failed = false;
  for (const [platform, result] of Object.entries(report)) {
    const complete = result.errors.length === 0 && result.unparsed === 0;
    console.log(
      `[${platform}] 연재본 관측 ${result.observations.length}개, 작품명 재검색 ${result.titleSearchCount}개, 파싱 실패 ${result.unparsed}개, 오류 ${result.errors.length}개, complete=${complete}`
    );
    for (const error of result.errors.slice(0, 5)) console.log(`  오류: ${error}`);
    if (!complete) failed = true;
    if (args.dryRun) continue;
    const sync = await apiRequest(args.api, token, "POST", "/v1/command/admins/external-distributions/sync", {
      platform,
      complete,
      observations: result.observations,
    });
    const data = sync?.data ?? {};
    console.log(
      `[${platform}] sync: 매칭 ${data.matchedCount}, 신규 ${data.insertedCount}, 갱신 ${data.updatedCount}, 수동보호 ${data.skippedManualCount}, 미관측+1 ${data.missedCount}, 미매칭 ${(data.unmatched ?? []).length}`
    );
  }
  if (failed) process.exitCode = 2;
};

main().catch((error) => {
  console.error(`[external-distribution] 실패: ${error.message || error}`);
  process.exitCode = 1;
});
