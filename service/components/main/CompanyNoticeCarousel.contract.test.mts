import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const componentSource = readFileSync(
  new URL("./CompanyNoticeCarousel.tsx", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/page.tsx", import.meta.url),
  "utf8",
);

assert.match(
  componentSource,
  /getCompanyNoticeCarouselVisibleCount/,
  "company notice carousel should use a dedicated layout utility",
);
assert.match(
  componentSource,
  /COMPANY_NOTICE_CAROUSEL_DESKTOP_MAX_WIDTH/,
  "company notice carousel should keep the 1120px desktop contract centralized",
);
assert.match(
  componentSource,
  /sizes="\(max-width: 767px\) 100vw, 367px"/,
  "company notice carousel image sizing should match the desktop 3-up card width",
);
assert.match(
  componentSource,
  /ResizeObserver/,
  "company notice carousel should measure available width for PC/MO behavior",
);
assert.match(
  componentSource,
  /object-cover/,
  "company notice images should fill cards without breaking the ratio",
);
assert.match(
  componentSource,
  /imageSrc:\s*string/,
  "company notice carousel data contract should be image-based",
);
assert.match(
  componentSource,
  /ariaLabel:\s*string/,
  "company notice carousel links should have accessible labels for full-image cards",
);
assert.match(
  componentSource,
  /COMPANY_NOTICE_ITEMS/,
  "company notice carousel should use real notice items instead of mock items",
);
assert.doesNotMatch(
  componentSource,
  /COMPANY_NOTICE_MOCK_ITEMS|company-notice-membership\.svg|company-notice-settlement\.svg|company-notice-upgrade\.svg|company-notice-support\.svg/,
  "company notice carousel should not ship placeholder mock notice assets",
);
assert.match(
  componentSource,
  /L6HeQiMCSziLoNswCiCTaQ\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/5[\s\S]*?8tgpcio9TbuweVtilwaXUQ\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/36[\s\S]*?vsJV-rkOQWK5P1rgqoNSoQ\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/40[\s\S]*?qdCb-kRCQ9yGD4aTrJfCAg\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/38[\s\S]*?uBydaISGQb-BrxRDCQUQww\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/32[\s\S]*?WVhvGyWPSFK_5Dl1rF29GQ\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/6/,
  "company notice carousel should keep the uploaded notice images and prod links in the requested order",
);
assert.doesNotMatch(
  componentSource,
  /linkPath:\s*"\/product\/customer-service\/notice\//,
  "company notice carousel should not use localhost-relative notice links",
);
assert.match(
  componentSource,
  /<a[\s\S]*href=\{normalizeUrl\(item\.linkPath\)\}/,
  "company notice carousel should expose each full-image card as a real link",
);
assert.match(
  componentSource,
  /aria-label=\{item\.ariaLabel\}/,
  "company notice carousel should name each linked image card",
);
assert.doesNotMatch(
  componentSource,
  /window\.open/,
  "company notice carousel should keep link behavior in the DOM contract instead of hidden click handlers",
);
assert.doesNotMatch(
  componentSource,
  /category:\s*string|title:\s*string|description:\s*string|summary:\s*string|content:\s*string|badgeText:\s*string/,
  "company notice carousel should not require text fields because cards are full-image assets",
);
assert.doesNotMatch(
  componentSource,
  /item\.category|item\.title|item\.description|item\.summary|item\.content|item\.badgeText/,
  "company notice carousel should not render text over full-image notice cards",
);
assert.doesNotMatch(
  componentSource,
  /bg-gradient-to-r/,
  "company notice carousel should not add a text readability overlay to full-image assets",
);
assert.match(
  componentSource,
  /aspectRatio:\s*"2 \/ 1"/,
  "company notice cards should preserve the 2:1 ratio in CSS",
);
assert.match(
  componentSource,
  /hidden md:flex/,
  "desktop arrows should be hidden on mobile",
);
assert.match(
  componentSource,
  /if \(count === 0\) return null/,
  "empty notice item data should not render the section",
);
assert.match(
  componentSource,
  /pageCount > 1/,
  "controls should only render when the carousel can page",
);
assert.doesNotMatch(
  componentSource,
  /react-slick/,
  "company notice carousel should not use react-slick for fixed 2-up sizing",
);

assert.match(
  pageSource,
  /import CompanyNoticeCarousel from "@\/components\/main\/CompanyNoticeCarousel"/,
  "home page should import the separate company notice carousel component",
);
assert.match(
  pageSource,
  /<PaidTop[\s\S]*?<\/div>\s*<CompanyNoticeCarousel \/>/,
  "company notice carousel should be placed in the main middle area after PaidTop",
);
