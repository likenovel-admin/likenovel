import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const constantsSource = read("../../constants/common.ts");
const ratingSource = read("./Rating.tsx");
const ratingFormSource = read("./RatingForm.tsx");
const reviewCardSource = read("./ReviewCard.tsx");
const authorHomeDesktopSource = read("../authorHome/MyProductManageArea.tsx");
const authorHomeMobileSource = read("../authorHome/MyProductManageAreaMobile.tsx");
const productEpisodesSource = read("../productDetail/ProductEpisodes.tsx");
const productCoverSource = read("../productDetail/ProductCoverArea.tsx");
const authorProductCoverSource = read("../episodeManager/ProductCoverArea.tsx");
const episodeRoundTabSource = read("../episodeManager/EpisodeRoundTab.tsx");

assert.match(
  constantsSource,
  /export const SHOW_PRODUCT_EVALUATION_SURFACE = false;/,
  "product evaluation surface must be disabled by a shared constant"
);

assert.match(
  ratingFormSource,
  /SHOW_PRODUCT_EVALUATION_SURFACE && evaluationOpenYn !== "N"/,
  "viewer evaluation input/results must be gated by the shared constant"
);
assert.match(
  ratingFormSource,
  /className=\{isEvaluationOpen \? "mt-\[23px\]" : "mt-0"\}/,
  "comment input must move up when evaluation surface is hidden"
);
assert.match(
  ratingSource,
  /SHOW_PRODUCT_EVALUATION_SURFACE \? "mt-\[109px\]" : "mt-24pxr"/,
  "viewer comment section wrapper must use compact spacing when evaluation is hidden"
);

assert.match(
  reviewCardSource,
  />평가하기</,
  "review card CTA text is outside the hidden evaluation area and must stay unchanged"
);

for (const [label, source] of [
  ["author home desktop", authorHomeDesktopSource],
  ["author home mobile", authorHomeMobileSource],
] as const) {
  assert.doesNotMatch(source, /useMyEvaluation/, `${label} must not fetch evaluation summary`);
  assert.doesNotMatch(source, /ProductReaction/, `${label} must not render evaluation summary`);
}

assert.match(
  productEpisodesSource,
  /<Rating className="w-\[14px\] h-\[14px\] text-dark-gray-300" \/>[\s\S]*?formatKoreanNumber\(episode\.countEvaluation\)/,
  "user product episode list evaluation count is outside the requested hidden area and must stay unchanged"
);
assert.match(
  productCoverSource,
  /const shouldShowEvaluationContainer = SHOW_PRODUCT_EVALUATION_SURFACE;/,
  "user product detail evaluation panel must use the shared gate"
);
assert.match(
  authorProductCoverSource,
  /const shouldShowEvaluationContainer = SHOW_PRODUCT_EVALUATION_SURFACE;/,
  "author product detail evaluation panel must use the shared gate"
);
assert.match(
  episodeRoundTabSource,
  /SHOW_PRODUCT_EVALUATION_SURFACE && \([\s\S]*?episode\.countEvaluation/,
  "author episode list must gate evaluation counts"
);
