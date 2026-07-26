import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const menuSource = readFileSync(
  new URL("./MiddleMenu.tsx", import.meta.url),
  "utf8"
);
const iconSource = readFileSync(
  new URL("../../public/images/protagonist-chat.svg", import.meta.url),
  "utf8"
);

test("홈 중간 메뉴는 작품리뷰 대신 주인공챗 목록으로 이동한다", () => {
  assert.match(
    menuSource,
    /import ProtagonistChat from "\/public\/images\/protagonist-chat\.svg"/
  );
  assert.match(
    menuSource,
    /icon: ProtagonistChat,[\s\S]*text: "주인공챗",[\s\S]*router\.push\("\/product\/character-chat"\)/
  );
  assert.doesNotMatch(menuSource, /import Review /);
  assert.doesNotMatch(menuSource, /작품리뷰|\/product\/review/);
});

test("주인공챗 바로가기는 기존 메뉴 규격의 전용 대화 아이콘을 사용한다", () => {
  assert.match(iconSource, /viewBox="0 0 30 30"/);
  assert.match(iconSource, /aria-hidden="true"/);
  assert.match(iconSource, /fill="#57D6FF"/);
  assert.match(iconSource, /fill="#17191D"/);
});
