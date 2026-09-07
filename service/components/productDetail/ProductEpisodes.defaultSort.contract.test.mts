import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./ProductEpisodes.tsx", import.meta.url), "utf8");
const episodeHookSource = readFileSync(
  new URL("../../app/api/query/episode/index.ts", import.meta.url),
  "utf8"
);
const productPageSource = readFileSync(
  new URL("../../app/product/[id]/ProductDetailClient.tsx", import.meta.url),
  "utf8"
);
const productDtoSource = readFileSync(
  new URL("../../app/api/query/product/dto.ts", import.meta.url),
  "utf8"
);
const cacheStatusModalSource = readFileSync(
  new URL("../modal/CacheStatusModal.tsx", import.meta.url),
  "utf8"
);

assert.match(
  source,
  /const defaultIsDescSort = priceType !== "paid";/,
  "ProductEpisodes should default paid products to first-episode order"
);
assert.match(
  source,
  /const \[isDescSort, setIsDescSort\] = useState\(defaultIsDescSort\);/,
  "ProductEpisodes sort state should use the price-type default"
);
assert.match(
  source,
  /setIsDescSort\(defaultIsDescSort\);/,
  "ProductEpisodes should sync the default sort after priceType is resolved"
);
assert.match(
  source,
  /const hasResolvedPriceType = priceType === "paid" \|\| priceType === "free";/,
  "ProductEpisodes should wait until priceType is resolved before fetching episodes"
);
assert.match(
  source,
  /const sortReadyKey = hasResolvedPriceType \? `\$\{productId\}:\$\{priceType\}` : "";/,
  "ProductEpisodes should key sort readiness by product and price type"
);
assert.match(
  source,
  /const isEpisodeQueryEnabled =\s*hasResolvedPriceType && sortReadyFor === sortReadyKey;/,
  "ProductEpisodes should enable episode queries only after sort state is ready"
);
assert.match(
  source,
  /isDescSort \? "desc" : "asc",\s*isEpisodeQueryEnabled/,
  "ProductEpisodes should request descending or ascending episode order from the API"
);
assert.doesNotMatch(
  source,
  /initialOwnerEpisodes|shouldUseOwnerEpisodes|sortedOwnerEpisodes/,
  "Reader detail must never substitute the management episode list, including for authors/admins"
);
assert.match(
  source,
  /if \(newCount >= allEpisodes.length - 5\)/,
  "Reader detail should paginate the same episode query for every role"
);
assert.match(
  source,
  /const canBypassEpisodePayment = isAuthor \|\| isAdminCPEditor;/,
  "ProductEpisodes should let authors/admins open owned management-visible paid episodes without the rent modal"
);
assert.match(
  episodeHookSource,
  /enabled: enabled && !!productId/,
  "useSelectEpisodes should support disabling the episode query until sort defaults are known"
);
assert.match(
  source,
  /waitForFreeYn: isWaitForFreePaidEpisode \? "Y" : "N"/,
  "ProductEpisodes should pass the WFF modal flag when a WFF paid episode opens the purchase modal"
);
assert.match(
  source,
  /setWffTimeRemaining\(`\$\{hours\}시간 \$\{minutes\}분`\)/,
  "ProductEpisodes should show WFF remaining time as hours and minutes"
);
assert.match(
  source,
  /void refetchTickets\(\)/,
  "ProductEpisodes should refetch tickets when WFF recharge becomes due or pending"
);
assert.match(
  source,
  /wffRechargePending \|\|/,
  "ProductEpisodes should suppress the countdown while WFF ticket recharge is pending"
);
assert.match(
  source,
  /!wffRechargePending && wffTimeRemaining/,
  "ProductEpisodes should render WFF remaining time only outside pending state"
);
assert.match(
  productPageSource,
  /productData\?\.badge\?\.waitForFreeYn === "Y"/,
  "product detail should treat waitForFreeYn=Y as WFF"
);
assert.match(
  productPageSource,
  /productData\?\.badge\?\.waitingForFreeYn === "Y"/,
  "product detail should treat waitingForFreeYn=Y as WFF"
);
assert.match(
  productPageSource,
  /ep.priceType === "paid" && ep.ownType !== "own"/,
  "ownership bulk purchase should include rented paid episodes that are not owned"
);
assert.match(
  productPageSource,
  /const serialEpisodeOwnPrice/,
  "product detail should compute the serial episode ownership price once for WFF modal payloads"
);
assert.match(
  productPageSource,
  /productData\?\.seriesRegularPrice/,
  "WFF modal ownership price should come from the serial episode price when available"
);
assert.match(
  productPageSource,
  /episodeOwnPrice=\{serialEpisodeOwnPrice\}/,
  "WFF modal should not hard-code the single episode ownership price"
);
assert.match(
  productPageSource,
  /episodeTypePaidCount \* serialEpisodeOwnPrice/,
  "WFF bulk purchase price should use the same serial episode unit price"
);
assert.match(
  productPageSource,
  /queryKey: \["getEpisodeList"\]/,
  "product detail should invalidate available-ticket state after ticket issuance"
);
assert.doesNotMatch(
  productPageSource,
  /ep\.ownType !== "rental"/,
  "ownership bulk purchase should not exclude rental access from own purchase targets"
);
assert.match(
  productDtoSource,
  /wff_next_charge_at_ms: number \| null;/,
  "available ticket DTO should expose the WFF recharge timestamp in milliseconds"
);
assert.match(
  productDtoSource,
  /wff_recharge_pending: boolean;/,
  "available ticket DTO should expose WFF recharge pending state"
);
assert.match(
  cacheStatusModalSource,
  /device === "mobile"/,
  "CacheStatusModal should keep mobile rendering on BottomSheetContainer"
);
assert.match(
  cacheStatusModalSource,
  /<BottomSheetContainer/,
  "CacheStatusModal should render as a bottom sheet on mobile"
);
assert.match(
  cacheStatusModalSource,
  /waitForFreeTickets/,
  "WFF modal should use WFF tickets separately from generic rental tickets"
);
assert.match(
  cacheStatusModalSource,
  /\.toLowerCase\(\)/,
  "WFF modal should normalize ticket type casing"
);
assert.match(
  cacheStatusModalSource,
  /waitingforfree/,
  "WFF modal should accept compact/camel-cased WFF ticket type variants after normalization"
);
assert.match(
  cacheStatusModalSource,
  /rentalPrice: 0/,
  "WFF bulk purchase should open the cash modal as ownership-only"
);
assert.match(
  cacheStatusModalSource,
  /기다무 대여권/,
  "WFF modal should show the WFF ticket action"
);
assert.match(
  cacheStatusModalSource,
  /소장권/,
  "WFF modal should show the ownership action"
);
assert.match(
  cacheStatusModalSource,
  /일괄구매/,
  "WFF modal should show the ownership bulk purchase action"
);
assert.doesNotMatch(
  cacheStatusModalSource,
  /#FFD339/,
  "WFF modal should not use Kakao-style yellow CTA color"
);
assert.doesNotMatch(
  cacheStatusModalSource,
  /rounded-\[28px\]/,
  "WFF modal should not use Kakao-style pill radius"
);

// Execute the real component with API/auth boundaries controlled; keep React hooks
// and local formatting/visibility helpers real so role-dependent rendering is tested.
const { createRequire } = await import("node:module");
const { runInNewContext } = await import("node:vm");
const { fileURLToPath } = await import("node:url");
const { dirname, resolve } = await import("node:path");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const serviceRoot = fileURLToPath(new URL("../../", import.meta.url));
const managementEpisodes = Array.from({ length: 200 }, (_, index) => ({
  episodeId: index + 1, productId: 1248, episodeNo: index + 1,
  episodeTitle: `EPISODE_${String(index + 1).padStart(3, "0")}`,
  episodeOpenYn: index < 5 ? "Y" : "N", priceType: "free",
  createdDate: "2026-09-07", publishReserveDate: index < 5 ? null : "2026-09-08T18:00:00",
  usage: { readYn: "N", recommendYn: "N" },
}));
const Empty = () => null;
const Children = ({ children }: { children?: unknown }) => React.createElement("span", null, children);
for (const role of ["guest", "reader", "author", "admin", "CP", "editor"]) {
  const auth = {
    user: role === "guest" ? null : { userId: role === "author" ? 2314 : 99, userRole: role },
    accessToken: role === "guest" ? null : "test-session", isAuthenticated: role !== "guest",
  };
  const calls: unknown[][] = [];
  const modules: Record<string, unknown> = {
    "@/app/api/query/episode": { useSelectEpisodes: (...args: unknown[]) => {
      calls.push(args);
      return { data: { pages: [{ data: { episodes: managementEpisodes.slice(0, 5).reverse() } }] }, fetchNextPage() {} };
    } },
    "@/app/api/query/product": { useGetAvailableTickets: () => ({}) },
    "@tanstack/react-query": { useQueryClient: () => ({}) },
    "@/store/authStore": { default: (select: (state: typeof auth) => unknown) => select(auth) },
    "@/store/modalStore": { default: () => ({ setTypeModal() {} }) },
    "@/hooks/useAuthWrapper": { useAuthWrapper: () => ({ withLoginRequired() {} }) },
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "next/image": { default: Empty },
  };
  function loadComponent(filename: string): Record<string, unknown> {
    const componentModule = { exports: {} };
    const output = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
      fileName: filename,
    }).outputText;
    runInNewContext(output, { module: componentModule, exports: componentModule.exports, require: (name: string) => {
      if (name in modules) return { __esModule: true, ...modules[name] as object };
      if (name.endsWith(".svg")) return { __esModule: true, default: Empty };
      if (["../common/Button", "../common/MoreReadButton", "../common/SquareBadge", "./ProductNotice"].includes(name))
        return { __esModule: true, default: name.includes("Button") ? Children : Empty };
      if (name.startsWith("@/")) return loadComponent(resolve(serviceRoot, name.slice(2) + ".ts"));
      if (name.startsWith(".")) return loadComponent(resolve(dirname(filename), name + ".ts"));
      return require(name);
    } });
    return componentModule.exports;
  }
  const component = loadComponent(fileURLToPath(new URL("./ProductEpisodes.tsx", import.meta.url))).default;
  const markup = renderToStaticMarkup(React.createElement(component, {
    productId: 1248, authorId: 2314, priceType: "free", episodeCount: 5,
    notices: [], initialOwnerEpisodes: managementEpisodes,
  }));
  assert.equal(calls.length, 1, `${role}: use the reader episode API`);
  assert.equal(calls[0][6], true, `${role}: do not disable the reader episode query`);
  assert.equal((markup.match(/EPISODE_\d{3}/g) ?? []).length, 5, `${role}: render exactly five published episodes`);
  assert.ok(markup.includes("EPISODE_001") && markup.includes("EPISODE_005"), `${role}: published bounds`);
  assert.ok(!markup.includes("EPISODE_006") && !markup.includes("EPISODE_200"), `${role}: reservations stay outside reader detail`);
  assert.ok(markup.includes("총 5화"), `${role}: visible count matches the reader list`);
}
console.log("PASS: reader detail renders five public episodes for all six auth roles");
