import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const productCardSource = readFileSync(
  new URL("../common/ProductListCard.tsx", import.meta.url),
  "utf8"
);
const bottomButtonSource = readFileSync(
  new URL("../makingProduct/BottomButton.tsx", import.meta.url),
  "utf8"
);
const formAreaSource = readFileSync(
  new URL("../makingProduct/FormArea.tsx", import.meta.url),
  "utf8"
);
const productDtoSource = readFileSync(
  new URL("../../app/api/query/author/product/dto.ts", import.meta.url),
  "utf8"
);
const episodeNavSource = readFileSync(
  new URL("../menu/EpisodeNav.tsx", import.meta.url),
  "utf8"
);
const makingEpisodeBottomButtonSource = readFileSync(
  new URL("../makingEpisode/BottomButton.tsx", import.meta.url),
  "utf8"
);

assert.match(
  productCardSource,
  /const episodeCount = data\.trendindex\?\.hasEpisodeCount \?\? 0/
);
assert.match(productCardSource, /episodeCount === 0 \? "신규회차쓰기" : "회차쓰기"/);
assert.match(productCardSource, /episodeCount === 0 \? "primary" : "black"/);
assert.match(productCardSource, /router\.push\(`\/making-episode\/\$\{data\.productId\}`\)/);
const authorFooterSource = productCardSource.slice(
  productCardSource.indexOf(
    'className="flex w-full flex-col items-center gap-10pxr'
  )
);
assert.ok(
  authorFooterSource.indexOf("신규회차쓰기") <
    authorFooterSource.indexOf("canShowApplyPaidButton"),
  "회차쓰기 CTA는 조건부 유료전환 영역보다 먼저 렌더링되어야 합니다."
);
assert.doesNotMatch(
  authorFooterSource.slice(0, authorFooterSource.indexOf("isOpenHelper.isOpen")),
  /absolute bottom-/
);
assert.match(
  productCardSource,
  /if \(isAuthorPage\)[\s\S]*event\.stopPropagation\(\)[\s\S]*`\/product\/author\/episode-manager\/\$\{data\.productId\}`/
);

assert.match(bottomButtonSource, /저장하고 회차쓰기/);
assert.match(bottomButtonSource, /variant="black"/);
assert.match(bottomButtonSource, /onSubmitIntentChange\("episode"\)/);

assert.match(formAreaSource, /submitIntentRef = useRef<"default" \| "episode">\("default"\)/);
assert.match(formAreaSource, /response\.data\.data\.product_id/);
assert.match(formAreaSource, /window\.location\.href = `\/making-episode\/\$\{newProductId\}`/);
assert.match(formAreaSource, /window\.location\.href = `\/making-episode\/\$\{productId\}`/);
assert.match(productDtoSource, /IProductMutationResponse/);
assert.match(productDtoSource, /product_id: number/);

for (const source of [episodeNavSource, makingEpisodeBottomButtonSource]) {
  assert.match(source, /`\/product\/author\/episode-manager\/\$\{productId\}`/);
  assert.doesNotMatch(source, /router\.back\(\)/);
}
