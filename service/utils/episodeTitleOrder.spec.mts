import assert from "node:assert/strict";
import { test } from "node:test";
import { reviewEpisodeTitleOrder } from "./episodeTitleOrder.ts";

const entries = (titles: string[]) => titles.map((episodeTitle, index) => ({
  episodeId: index + 101,
  episodeNo: index + 1,
  episodeTitle,
}));

const cases: [string, string[], string, boolean][] = [
  ["숫자만 있는 제목 연속", ["18", "19"], "20", false],
  ["숫자만 있는 제목 누락", ["18", "19"], "21", true],
  ["숫자만 있는 제목 중복", ["18", "19"], "19", true],
  ["숫자만 있는 제목 역전", ["18", "19"], "17", true],
  ["숫자만 있는 제목과 명시적 번호 혼합", ["18", "제19화. 성장"], "21", true],
  ["숫자만 있는 전각 제목", ["１８", "１９"], "２１", true],
  ["연속 번호", ["블러튼제국 3", "블러튼제국 4"], "블러튼제국 5", false],
  ["누락", ["블러튼제국 3", "블러튼제국 4"], "블러튼제국 6", true],
  ["중복", ["블러튼제국 3", "블러튼제국 4"], "블러튼제국 4", true],
  ["역전", ["블러튼제국 3", "블러튼제국 4"], "블러튼제국 2", true],
  ["새 소제목", ["성장3"], "환생1", false],
  ["같은 소제목 1부터 재시작", ["성장3"], "성장1", false],
  ["처음 등장하는 번호는 단정하지 않음", [], "성장5", false],
  ["번호 없는 제목", ["환생", "성장"], "각성", false],
  ["단독 숫자 포함 제목", ["1988년 서울"], "1990년 부산", false],
  ["앞 번호 우선", ["#1 환생", "#2 성장9"], "#3 성장2", false],
  ["앞 번호 누락", ["#1 환생", "#3 성장"], "#5 성장2", true],
  ["명시적인 화 번호", ["1화. 환생", "2화. 성장"], "4화. 각성", true],
  ["숫자와 마침표", ["1. 환생", "2. 성장"], "4. 각성", true],
  ["괄호 소제목 번호", ["성장 (1)", "성장 (2)"], "성장 (4)", true],
  ["전각 숫자", ["성장１", "성장２"], "성장４", true],
  ["소제목 교차 정상", ["성장", "성장2", "환생1", "환생2", "각성1", "각성2", "환생3"], "성장3", false],
  ["소제목 교차 누락", ["환생1", "환생2", "각성1", "각성2"], "환생4", true],
  ["번호 없는 첫 편 추정", ["성장", "성장2", "각성1"], "성장4", true],
  ["숫자 없는 첫 편만으로 추정하지 않음", ["성장"], "성장3", false],
  ["무관한 과거 오류", ["성장1", "성장4", "각성1"], "각성2", false],
  ["새 장의 앞 번호 재시작", ["#9 마지막 전투"], "#1 새로운 시작", false],
  ["앞 괄호 번호", ["(1) 환생", "(2) 성장"], "(4) 각성", true],
  ["앞 꺾쇠 번호", ["<1> 환생", "<2> 성장"], "<4> 각성", true],
  ["뒤 꺾쇠 번호", ["성장<1>", "성장<2>"], "성장<4>", true],
  ["한자 괄호 번호", ["(一) 환생", "(二) 성장"], "(四) 각성", true],
  ["한자 앞 번호", ["一 환생", "二 성장"], "四 각성", true],
  ["한자 번호만 있는 제목", ["一", "二"], "四", true],
  ["한자 꺾쇠 번호", ["<一> 환생", "<二> 성장"], "<三> 각성", false],
  ["한자 소제목 교차", ["성장一", "성장二", "각성一"], "성장四", true],
  ["한자 십의 자리", ["성장九", "성장十"], "성장十一", false],
  ["한자 십의 자리 누락", ["성장九", "성장十"], "성장十二", true],
  ["한자 백의 자리", ["제九十九화. 환생", "제一百화. 성장"], "제一百零二화. 각성", true],
  ["한자 단어는 숫자 아님", ["唯一"], "統一", false],
  ["한글 일반 단어는 숫자 아님", ["유일", "통일"], "일이삼사", false],
];

for (const [name, previous, current, warning] of cases) {
  test(name, () => {
    assert.equal(reviewEpisodeTitleOrder(entries(previous), current).hasWarning, warning);
  });
}

test("비공개·예약도 포함하고 원본을 바꾸지 않으며 플랫폼 번호로 정렬", () => {
  const previous = Object.freeze([
    Object.freeze({ episodeId: 3, episodeNo: 138, episodeTitle: "성장2", openYn: "N", publishReserveDate: "2099-01-01" }),
    Object.freeze({ episodeId: 2, episodeNo: 137, episodeTitle: "성장1", openYn: "N" }),
    Object.freeze({ episodeId: 4, episodeNo: 139, episodeTitle: "성장3", useYn: "N" as const }),
  ]);
  const review = reviewEpisodeTitleOrder(previous, "성장4");
  assert.equal(review.hasWarning, true);
  assert.deepEqual(review.rows.map((row) => row.episodeNo), [137, 138, 139]);
  assert.deepEqual(review.rows.map((row) => row.isCurrent), [false, false, true]);
  assert.equal(review.rows.at(-1)?.episodeId, null);
  assert.equal(previous[0].episodeTitle, "성장2");
});

test("수정은 원래 위치에서 자신을 제외하고 앞뒤를 검사", () => {
  const previous = entries(["#1 환생", "#2 성장", "#3 각성"]);
  const normal = reviewEpisodeTitleOrder(previous, "#2 성장2", 102);
  assert.equal(normal.hasWarning, false);
  assert.equal(normal.rows.length, 3);
  assert.equal(normal.rows[1].isCurrent, true);
  assert.equal(normal.rows[1].episodeId, 102);
  assert.equal(reviewEpisodeTitleOrder(previous, "#4 성장", 102).hasWarning, true);
  assert.equal(reviewEpisodeTitleOrder(previous, "#2 환생", 101).hasWarning, true);
});

test("19를 기존 다음 회차 제목인 20으로 수정하면 중복 경고", () => {
  const previous = entries(["18", "19", "20"]);
  const result = reviewEpisodeTitleOrder(previous, "20", 102);
  assert.equal(result.hasWarning, true);
  assert.deepEqual(result.rows.map((row) => row.episodeTitle), ["18", "20", "20"]);
  assert.equal(result.rows[1].episodeId, 102);
  assert.equal(reviewEpisodeTitleOrder(previous, "19", 102).hasWarning, false);
});

test("수정으로 기존 누락을 채운 경우 경고가 사라짐", () => {
  assert.equal(reviewEpisodeTitleOrder(entries(["성장1", "성장3", "성장3"]), "성장2", 102).hasWarning, false);
});

test("번호 없는 첫 편을 수정할 때도 다음 묶음과 이어짐", () => {
  assert.equal(reviewEpisodeTitleOrder(entries(["성장", "성장2", "각성1"]), "성장", 101).hasWarning, false);
});

test("목록에서 수정 대상을 찾지 못하면 새 회차로 처리하지 않음", () => {
  assert.throws(() => reviewEpisodeTitleOrder(entries(["성장1"]), "성장3", 999));
});

test("한자 자리수와 괄호 종류를 실제 숫자와 동일하게 비교", () => {
  const samples: [string, number][] = [["一", 1], ["二", 2], ["九", 9], ["十", 10],
    ["十一", 11], ["二十", 20], ["二十一", 21], ["九十九", 99], ["一百", 100],
    ["一百零一", 101], ["一百一十", 110], ["一百一十一", 111], ["九百九十九", 999],
    ["一千", 1000], ["一千零一", 1001]];
  for (const [han, number] of samples) {
    for (const [open, close] of [["(", ")"], ["[", "]"], ["<", ">"]]) {
      const title = `${open}${han}${close} 새 소제목`;
      assert.equal(reviewEpisodeTitleOrder(entries([`#${number} 이전 소제목`]), title).hasWarning, true, `duplicate ${title}`);
      assert.equal(reviewEpisodeTitleOrder(entries([`#${number - 1} 이전 소제목`]), title).hasWarning, false, `next ${title}`);
    }
  }
});
