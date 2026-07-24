import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const componentSource = readFileSync(
  new URL("./CompanyNoticeCarousel.tsx", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/HomePageClient.tsx", import.meta.url),
  "utf8",
);
const bannerQuerySource = readFileSync(
  new URL("../../app/api/query/banner/index.ts", import.meta.url),
  "utf8",
);

assert.match(
  componentSource,
  /getCompanyNoticeCarouselVisibleCount/,
  "company notice carousel should use a dedicated layout utility",
);
assert.match(
  componentSource,
  /getCompanyNoticeCarouselLoopBuffer/,
  "company notice carousel should use loop buffer clones for infinite one-card sliding",
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
  /L6HeQiMCSziLoNswCiCTaQ\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/5[\s\S]*?8tgpcio9TbuweVtilwaXUQ\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/36[\s\S]*?vsJV-rkOQWK5P1rgqoNSoQ\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/40[\s\S]*?company-notice-ai-consent\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/43[\s\S]*?qdCb-kRCQ9yGD4aTrJfCAg\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/38[\s\S]*?uBydaISGQb-BrxRDCQUQww\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/32[\s\S]*?WVhvGyWPSFK_5Dl1rF29GQ\.webp[\s\S]*?https:\/\/www\.likenovel\.net\/product\/customer-service\/notice\/6/,
  "company notice carousel should keep the notice images and prod links in the requested order",
);
assert.match(
  componentSource,
  /ariaLabel:\s*"홍보 콘텐츠 게재 동의 안내 공지"/,
  "company notice carousel should name the AI consent notice card",
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
  /번째 회사 공지 페이지|Array\.from\(\{ length: pageCount \}\)|goToTrackIndex/,
  "company notice carousel should not render dot pagination",
);
assert.match(
  componentSource,
  /items\.slice\(-loopBuffer\)[\s\S]*items\.slice\(0,\s*loopBuffer\)/,
  "company notice carousel should render head and tail clones for infinite looping",
);
assert.match(
  componentSource,
  /const isVisibleCard =[\s\S]*renderIndex >= trackIndex[\s\S]*renderIndex < trackIndex \+ visibleCount/,
  "company notice carousel should know which rendered cards are currently visible",
);
assert.match(
  componentSource,
  /aria-hidden=\{!isVisibleCard\}/,
  "company notice carousel should hide offscreen cards from assistive technologies",
);
assert.match(
  componentSource,
  /tabIndex=\{isVisibleCard \? undefined : -1\}/,
  "company notice carousel should only focus currently visible card links",
);
assert.match(
  componentSource,
  /setTrackIndex\(\(index\)\s*=>\s*index \+ 1\)/,
  "next and auto rotation should advance one card at a time",
);
assert.match(
  componentSource,
  /setTrackIndex\(\(index\)\s*=>\s*index - 1\)/,
  "previous arrow should move back one card at a time",
);
assert.match(
  componentSource,
  /autoRotateResetKey/,
  "manual company notice carousel movement should reset auto rotation timing",
);
assert.match(
  componentSource,
  /setAutoRotateResetKey\(\(key\)\s*=>\s*key \+ 1\)/,
  "manual carousel controls should restart the auto rotation interval",
);
assert.match(
  componentSource,
  /onTransitionEnd=\{handleTrackTransitionEnd\}/,
  "company notice carousel should reset clone positions after transition for infinite looping",
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
  /COMPANY_NOTICE_BANNER_POSITION\s*=\s*"companyNotice"/,
  "home page should bind company notice carousel to the CMS companyNotice banner position",
);
assert.match(
  pageSource,
  /useSelectPanels\(\{\s*division:\s*COMPANY_NOTICE_BANNER_POSITION,\s*enabled:\s*homeQueryState\.enabled,\s*\}\)/,
  "home page should fetch the CMS-managed company notice banners through the public banner query",
);
assert.match(
  pageSource,
  /getCompanyNoticeItemsFromPanels\(companyNoticeBannerData\?\.data\)/,
  "home page should map public banner panels into company notice carousel items",
);
assert.match(
  pageSource,
  /const companyNoticeCmsItems = useMemo\([\s\S]*getCompanyNoticeItemsFromPanels\(companyNoticeBannerData\?\.data\)[\s\S]*\);/,
  "home page should map the CMS company notice banner list before choosing the carousel item list",
);
assert.match(
  pageSource,
  /const companyNoticeItems =\s*companyNoticeCmsItems\.length > 0\s*\?\s*companyNoticeCmsItems\s*:\s*undefined;/,
  "home page should preserve the built-in notice carousel when CMS has no company notice banners",
);
assert.match(
  pageSource,
  /<PaidTop[\s\S]*?<\/div>\s*<CompanyNoticeCarousel items=\{companyNoticeItems\} \/>/,
  "company notice carousel should be placed in the main middle area after PaidTop",
);
assert.match(
  bannerQuerySource,
  /enabled:\s*enabled && Boolean\(division\)/,
  "public banner query should support disabling the company notice request until home queries are enabled",
);
