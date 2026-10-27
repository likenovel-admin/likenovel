import assert from "node:assert/strict";

import {
  SERIAL,
  SINGLE_VOLUME,
  dedupeObservations,
  isCandidateCovered,
  normalizeText,
  parseKakaoLabel,
  parseRidiCard,
} from "./parse.mjs";

// 카카오: 상태 꼬리말, 쉼표 포함 제목, 단행본 표시, 웹툰 제외
assert.deepEqual(
  parseKakaoLabel(
    "70795886",
    "작품, 차원의 문: 일곱열매, 최신 회차 업데이트됨, 기다무, 웹소설, 판타지, 작가 김봉진, 조회수 1.2만, 26.10.20 업데이트"
  ),
  { external_id: "70795886", title: "차원의 문: 일곱열매", author: "김봉진", edition: SERIAL }
);
assert.equal(
  parseKakaoLabel(
    "70394860",
    "작품, 농사꾼, 천하제일문을 꿈꾸다, 최신 회차 업데이트됨, 기다무, 웹소설, 무협, 작가 닥터KIMDH, 조회수 3만"
  ).title,
  "농사꾼, 천하제일문을 꿈꾸다"
);
assert.deepEqual(
  parseKakaoLabel(
    "66970456",
    "작품, 소설 속 천재 뮤지컬 배우가 되었다 [단행본], 웹소설, 현판, 작가 려누한, 조회수 1,095"
  ),
  {
    external_id: "66970456",
    title: "소설 속 천재 뮤지컬 배우가 되었다",
    author: "려누한",
    edition: SINGLE_VOLUME,
  }
);
assert.equal(
  parseKakaoLabel(
    "63348439",
    "작품, 내 아공간 속 던전 147,916,482,938개, 기다무, 웹소설, 판타지, 작가 lv121, 조회수 625.4만"
  ).title,
  "내 아공간 속 던전 147,916,482,938개"
);
assert.equal(parseKakaoLabel("1", "작품, 어떤 웹툰, 웹툰, 액션, 작가 누군가, 조회수 1만"), null);
assert.equal(parseKakaoLabel("1", "광고 배너"), null);

// 리디: 라이크노벨 연재본만 serial
assert.deepEqual(
  parseRidiCard({
    externalId: "4610005070",
    title: "프로스티 온더 프로즌 스틸",
    authors: ["inigene"],
    publishers: ["라이크노벨"],
    countTexts: ["총 166화"],
  }),
  { external_id: "4610005070", title: "프로스티 온더 프로즌 스틸", author: "inigene", edition: SERIAL }
);
assert.equal(
  parseRidiCard({
    externalId: "4610007589",
    title: "[e북] 다 해먹는 2회차 동네 약사",
    authors: ["다나핑"],
    publishers: ["라이크노벨"],
    countTexts: ["총 6권"],
  }).edition,
  SINGLE_VOLUME
);
assert.equal(
  parseRidiCard({
    externalId: "1",
    title: "마지막 소원",
    authors: ["줄리아 제임스"],
    publishers: ["신영할리퀸"],
    countTexts: ["총 1권"],
  }),
  null
);

// 작품명 재검색 생략 판단
const observations = [
  { external_id: "70795886", title: "차원의 문: 일곱열매", author: "김봉진", edition: SERIAL },
  { external_id: "66970456", title: "소설 속 천재 뮤지컬 배우가 되었다", author: "려누한", edition: SINGLE_VOLUME },
];
assert.equal(isCandidateCovered({ title: "차원의문 일곱열매", authorName: "김봉진" }, observations), true);
assert.equal(isCandidateCovered({ title: "마지막소원", authorName: "김봉진" }, observations), false);
// 단행본만 있으면 연재본을 따로 찾아야 한다.
assert.equal(
  isCandidateCovered({ title: "소설 속 천재 뮤지컬 배우가 되었다", authorName: "려누한" }, observations),
  false
);

assert.equal(normalizeText("차원의 문: 일곱열매"), normalizeText("차원의문 일곱열매"));
assert.equal(dedupeObservations([...observations, observations[0]]).length, 2);

console.log("external-distribution parse ok");
