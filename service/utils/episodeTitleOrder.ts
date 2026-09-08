import type { IEpisode } from "@/types";

type EpisodeTitleEntry = Pick<IEpisode, "episodeId" | "episodeNo" | "episodeTitle"> &
  Partial<Pick<IEpisode, "useYn">>;

export type EpisodeOrderRow = Omit<EpisodeTitleEntry, "episodeId" | "useYn"> & {
  episodeId: number | null;
  isCurrent: boolean;
};

type TitleNumber = { group: string; number: number };
const letterPattern = new RegExp("\\p{L}", "u");
const hanNumberToken = "[〇零一二三四五六七八九十百千]+";
const numberToken = "(?:[0-9]+|" + hanNumberToken + ")";
const leadingPatterns = [
  new RegExp("^#\\s*(" + numberToken + ")(?:\\s|[.:)]|$)"),
  new RegExp("^\\(\\s*(" + numberToken + ")\\s*\\)"),
  new RegExp("^\\[\\s*(" + numberToken + ")\\s*\\]"),
  new RegExp("^<\\s*(" + numberToken + ")\\s*>"),
  new RegExp("^(" + hanNumberToken + ")(?:\\s+|$)"),
  new RegExp("^(?:제\\s*|第\\s*)?(" + numberToken + ")\\s*(?:화|회|話|回)(?:\\s|[.:)]|$)"),
  new RegExp("^(" + numberToken + ")[.)]\\s+\\S"),
];
const trailingPattern = new RegExp(
  "^(.+?)\\s*(?:\\(\\s*(" + numberToken + ")\\s*\\)|\\[\\s*(" + numberToken +
  ")\\s*\\]|<\\s*(" + numberToken + ")\\s*>|(" + numberToken + ")(?:\\s*(?:화|話))?)$"
);
const hanDigits: Record<string, number> = { "〇": 0, "零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9 };
const hanUnits: Record<string, number> = { "十": 10, "百": 100, "千": 1000 };

const normalizeTitle = (title: string) => title.normalize("NFKC").trim().replace(/\s+/g, " ");

function parseOrdinal(value: string): number | null {
  if (/^\d+$/.test(value)) {
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
  }
  if (!/[十百千]/.test(value)) {
    const number = Number(value.split("").map((character) => hanDigits[character]).join(""));
    return Number.isSafeInteger(number) ? number : null;
  }
  let total = 0;
  let pending: number | null = null;
  let lastUnit = Infinity;
  for (const character of value) {
    const digit = hanDigits[character];
    if (digit !== undefined) {
      if (pending !== null && pending !== 0) return null;
      pending = digit;
      continue;
    }
    const unit = hanUnits[character];
    if (!unit || unit >= lastUnit || pending === 0) return null;
    total += (pending ?? 1) * unit;
    pending = null;
    lastUnit = unit;
  }
  return total + (pending ?? 0);
}

function parseTitleNumber(title: string): TitleNumber | null {
  // Explicit leading episode numbers take precedence over digits in the subtitle.
  for (const pattern of leadingPatterns) {
    const leading = title.match(pattern);
    if (!leading) continue;
    const number = parseOrdinal(leading[1]);
    return number === null ? null : { group: "leading", number };
  }
  const trailing = title.match(trailingPattern);
  if (!trailing) return null;
  const base = trailing[1].trim();
  const token = trailing[2] ?? trailing[3] ?? trailing[4] ?? trailing[5];
  const number = parseOrdinal(token);
  if (!letterPattern.test(base) || number === null) return null;
  // Do not reinterpret the last character of an undelimited Han word (e.g. 唯一).
  if (trailing[5] && !/^\d+$/.test(token) && !/[가-힣A-Za-z]/.test(base) && !title.includes(" ")) return null;
  return { group: `subtitle:${base}`, number };
}

function hasCurrentOrderWarning(rows: readonly EpisodeOrderRow[]): boolean {
  const titles = rows.map((row) => normalizeTitle(row.episodeTitle));
  const numbers = titles.map(parseTitleNumber);
  // Infer an unnumbered first part only when the matching second part exists.
  const secondParts = new Set(numbers.filter((item) => item?.number === 2).map((item) => item?.group));
  const inferred = numbers.map((item, index) => item ?? (
    secondParts.has(`subtitle:${titles[index]}`)
      ? { group: `subtitle:${titles[index]}`, number: 1 }
      : null
  ));
  const currentIndex = rows.findIndex((row) => row.isCurrent);
  const current = inferred[currentIndex];
  if (!current) return false;
  const related = inferred.flatMap((item, index) => item?.group === current.group ? [{ ...item, index }] : []);
  const position = related.findIndex((item) => item.index === currentIndex);
  const previous = related[position - 1];
  const next = related[position + 1];
  // Restarting at 1 can mark a new chapter, so do not call it an inversion.
  const isDiscontinuous = (before: number, after: number) =>
    after !== before + 1 && !(after === 1 && before > 1);
  return Boolean(
    (previous && isDiscontinuous(previous.number, current.number)) ||
    (next && isDiscontinuous(current.number, next.number))
  );
}

export function reviewEpisodeTitleOrder(
  episodes: readonly EpisodeTitleEntry[],
  title: string,
  episodeId?: number
): { rows: EpisodeOrderRow[]; hasWarning: boolean } {
  const rows: EpisodeOrderRow[] = episodes
    .filter((episode) => episode.useYn !== "N")
    .map((episode) => ({
      episodeId: episode.episodeId,
      episodeNo: episode.episodeNo,
      episodeTitle: episode.episodeId === episodeId ? title : episode.episodeTitle,
      isCurrent: episode.episodeId === episodeId,
    }))
    .sort((a, b) => a.episodeNo - b.episodeNo);

  if (episodeId !== undefined && !rows.some((row) => row.isCurrent)) {
    throw new Error("수정할 회차를 찾을 수 없습니다.");
  }
  if (episodeId === undefined) {
    rows.push({
      episodeId: null,
      episodeNo: (rows.at(-1)?.episodeNo ?? 0) + 1,
      episodeTitle: title,
      isCurrent: true,
    });
  }
  return { rows, hasWarning: hasCurrentOrderWarning(rows) };
}
