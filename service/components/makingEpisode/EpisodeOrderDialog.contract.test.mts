import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const dialogSource = readFileSync(new URL("./EpisodeOrderDialog.tsx", import.meta.url), "utf8");
const formSource = readFileSync(new URL("./FormArea.tsx", import.meta.url), "utf8");

// 모달 행은 제목만이 아니라 공개 상태와 일시까지 보여준다.
assert.ok(dialogSource.includes("releaseBadgeType[row.releaseState]"));
assert.ok(dialogSource.includes('open: "release"'));
assert.ok(dialogSource.includes('reserve: "reservation"'));
assert.ok(dialogSource.includes('private: "private"'));
assert.ok(dialogSource.includes("공개예정"));
assert.ok(dialogSource.includes("공개예정일시 미정"));
assert.ok(dialogSource.includes("등록"));
assert.ok(dialogSource.includes("row.publishReserveDate"));
assert.ok(dialogSource.includes("row.createdDate"));

// 회차관리 목록과 같은 시각 표기를 사용한다.
assert.ok(dialogSource.includes('toLocaleString("ko-KR"'));
assert.ok(dialogSource.includes("hour12: false"));
assert.ok(dialogSource.includes("Number.isNaN(date.getTime())"));

// 수정·등록 중인 회차는 저장될 공개 상태와 예약일시를 반영한다.
assert.ok(formSource.includes("releaseState:"));
assert.ok(formSource.includes("publishReserveDate:"));
assert.ok(formSource.includes("dayjs(formData.publishEpisodeDate).toISOString()"));

// 모달은 확인 화면이므로 값을 자동 보정하지 않는다.
assert.ok(!dialogSource.includes("setValue"));
assert.ok(!dialogSource.includes("mutate"));

console.log("EpisodeOrderDialog contract tests passed");
