import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const authorPageSource = readFileSync(
  new URL("../../app/product/author/page.tsx", import.meta.url),
  "utf8"
);
const productListCardSource = readFileSync(
  new URL("../common/ProductListCard.tsx", import.meta.url),
  "utf8"
);

assert.match(
  authorPageSource,
  /const isAuthInitialized = useAuthStore\(\s*\(state\) => state\.isAuthInitialized\s*\)/
);
assert.match(
  authorPageSource,
  /const isAuthenticated = useAuthStore\(\(state\) => state\.isAuthenticated\)/
);
assert.doesNotMatch(
  authorPageSource,
  /useAuthStore\(\(state\) => \(\{[\s\S]*?isAuthInitialized/
);
assert.match(
  authorPageSource,
  /router\.replace\("\/login\?redirect=%2Fproduct%2Fauthor", \{ scroll: false \}\)/
);
assert.match(
  authorPageSource,
  /if \(!isAuthInitialized \|\| !isAuthenticated\) return null;/
);
assert.ok(
  authorPageSource.indexOf(
    "if (!isAuthInitialized || !isAuthenticated) return null;"
  ) < authorPageSource.indexOf("<ProductArea />"),
  "ProductArea must not render before authentication is initialized and valid"
);

assert.match(
  productListCardSource,
  /isAuthorPage \? "w-full md:w-\[60%\] cursor-pointer" : "w-full"/
);
assert.match(
  productListCardSource,
  /isAuthorPage\s*\?\s*"flex flex-wrap gap-x-5pxr gap-y-3pxr md:gap-x-12pxr items-center"\s*:\s*"flex flex-wrap gap-5pxr md:gap-12pxr items-center"/
);
assert.match(
  productListCardSource,
  /data\.properties\?\.latestEpisodeDate && \(\s*isAuthorPage \? \(\s*<span className="flex shrink-0 items-center gap-5pxr">[\s\S]*?getLatestEpisodeDate/
);
assert.match(
  productListCardSource,
  /\) : \(\s*<>\s*<div className="w-\[1px\] h-\[10px\] border border-l-light-gray-500 border-r-0 border-t-0 border-b-0" \/>/
);
assert.match(
  productListCardSource,
  /\{isAuthorPage && data\.genre\.length > 0 && \(\s*<div className="md:hidden w-3pxr h-3pxr bg-dark-gray-100 rounded-full mx-2" \/>/
);
