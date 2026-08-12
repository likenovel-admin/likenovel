import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const componentSource = readFileSync(
  new URL("./AuthorStartCta.tsx", import.meta.url),
  "utf8"
);
const homePageSource = readFileSync(
  new URL("../../app/HomePageClient.tsx", import.meta.url),
  "utf8"
);
const makingProductPageSource = readFileSync(
  new URL("../../app/product/author/making-product/page.tsx", import.meta.url),
  "utf8"
);

assert.match(componentSource, /25화 쓰고 유료작가에 도전해보세요/);
assert.match(
  componentSource,
  /라이크노벨에서는 25화 이상 연재하면 표지와 함께 누구나 유료로\s*출간할 수 있어요\./
);
assert.match(componentSource, />\s*연재 시작\s*</);

assert.match(componentSource, /bg-primary-100/);
assert.match(componentSource, /text-white/);
const buttonSource = componentSource.slice(
  componentSource.indexOf("<button"),
  componentSource.indexOf("</button>")
);
assert.match(buttonSource, /bg-white/);
assert.match(buttonSource, /text-primary-100/);
assert.match(buttonSource, /rounded-\[14px\]/);
assert.doesNotMatch(componentSource, /text-white\/\d+|bg-white\/\d+|bg-gradient/);
assert.doesNotMatch(componentSource, /rounded-\[100px\]|hover:scale|translate-y/);

assert.match(componentSource, /isAuthInitialized/);
assert.match(componentSource, /isAuthenticated/);
assert.match(
  componentSource,
  /const MAKING_PRODUCT_LOGIN_PATH =[\s\S]*"\/login\?redirect=%2Fproduct%2Fauthor%2Fmaking-product"/
);
assert.match(componentSource, /window\.location\.href = MAKING_PRODUCT_LOGIN_PATH/);
assert.match(
  componentSource,
  /const MAKING_PRODUCT_PATH = "\/product\/author\/making-product"/
);
assert.match(componentSource, /router\.push\(MAKING_PRODUCT_PATH\)/);
assert.doesNotMatch(componentSource, /useSelectUserInfo|WarningModal|isCpUser/);

assert.match(
  makingProductPageSource,
  /isCpUser[\s\S]*파트너사이트에서 신규작품생성을 해주세요\.[\s\S]*router\.replace\("\/product\/author"\)/
);

assert.match(
  homePageSource,
  /import AuthorStartCta from "@\/components\/main\/AuthorStartCta"/
);

const ctaIndex = homePageSource.indexOf("<AuthorStartCta />");
const onboardingIndex = homePageSource.indexOf("<OnboardingModal");
const floatingDockIndex = homePageSource.indexOf("<FloatingDock footerOffset={110} />");
const footerIndex = homePageSource.indexOf("<Footer />");

assert.ok(ctaIndex >= 0, "home page should render the author CTA");
assert.ok(
  ctaIndex < onboardingIndex &&
    onboardingIndex < floatingDockIndex &&
    floatingDockIndex < footerIndex,
  "author CTA should render before the onboarding modal, floating dock, and footer"
);
