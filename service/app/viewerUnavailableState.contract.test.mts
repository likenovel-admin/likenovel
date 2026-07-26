import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  isViewerPurchaseRequiredResponse,
  shouldAutoOpenViewerPurchaseModal,
  shouldOpenViewerPurchaseModal,
} from "../utils/viewerPurchaseResume.ts";

const purchaseRequiredResponse = {
  status: 403,
  code: "PURCHASE_REQUIRED",
};

assert.equal(
  isViewerPurchaseRequiredResponse(purchaseRequiredResponse),
  true,
  "The exact backend purchase-required response should be classified separately"
);
assert.equal(
  isViewerPurchaseRequiredResponse({ status: 403, code: "FORBIDDEN" }),
  false,
  "An unrelated 403 must not be classified as purchase-required"
);
assert.equal(
  shouldOpenViewerPurchaseModal({
    ...purchaseRequiredResponse,
    isAuthenticated: true,
    episodeId: 22255,
    productId: 1135,
  }),
  true,
  "An authenticated paid viewer resume with complete identifiers should open the purchase modal"
);

for (const ineligibleCase of [
  {
    ...purchaseRequiredResponse,
    isAuthenticated: false,
    episodeId: 22255,
    productId: 1135,
  },
  {
    status: 401,
    code: "PURCHASE_REQUIRED",
    isAuthenticated: true,
    episodeId: 22255,
    productId: 1135,
  },
  {
    status: 403,
    code: "FORBIDDEN",
    isAuthenticated: true,
    episodeId: 22255,
    productId: 1135,
  },
  {
    ...purchaseRequiredResponse,
    isAuthenticated: true,
    episodeId: 0,
    productId: 1135,
  },
  {
    ...purchaseRequiredResponse,
    isAuthenticated: true,
    episodeId: 22255,
    productId: 0,
  },
]) {
  assert.equal(
    shouldOpenViewerPurchaseModal(ineligibleCase),
    false,
    "Guest, non-purchase errors, and incomplete viewer identifiers must not open the purchase modal"
  );
}

const autoOpenDecision = {
  shouldOpenPurchaseModal: true,
  episodeId: 22255,
  autoOpenedEpisodeId: null as number | null,
};
assert.equal(
  shouldAutoOpenViewerPurchaseModal(autoOpenDecision),
  true,
  "The first eligible purchase-required response should auto-open the modal"
);
autoOpenDecision.autoOpenedEpisodeId = autoOpenDecision.episodeId;
assert.equal(
  shouldAutoOpenViewerPurchaseModal(autoOpenDecision),
  false,
  "Closing and re-rendering the same episode must not auto-open the modal again"
);
assert.equal(
  shouldAutoOpenViewerPurchaseModal({
    ...autoOpenDecision,
    shouldOpenPurchaseModal: false,
  }),
  false,
  "A successful viewer refetch must not reopen the purchase modal"
);
assert.equal(
  shouldAutoOpenViewerPurchaseModal({
    ...autoOpenDecision,
    episodeId: 22256,
  }),
  true,
  "A different eligible episode should be allowed to auto-open once"
);

const viewerPagePath = existsSync("service/app/viewer/[id]/page.tsx")
  ? "service/app/viewer/[id]/page.tsx"
  : "app/viewer/[id]/page.tsx";
const source = readFileSync(viewerPagePath, "utf8");

assert.match(
  source,
  /const params = useParams/,
  "Viewer page should use the stable [id] route param while an intercepted login modal changes the visible pathname"
);

assert.doesNotMatch(
  source,
  /pathname\.split\("\/"\)/,
  "Viewer page should not derive episodeId from usePathname because login modal interception changes the visible pathname"
);

assert.match(
  source,
  /error:\s*viewerError[\s\S]*isError:\s*isViewerError[\s\S]*isLoading:\s*isViewerLoading[\s\S]*refetch:\s*refetchViewerPath/,
  "Viewer page should read query loading/error state instead of relying only on data"
);

assert.match(
  source,
  /const viewerErrorStatus = axios\.isAxiosError\(viewerError\)/,
  "Viewer page should derive the unavailable-state copy from the actual HTTP error status"
);

assert.match(
  source,
  /const viewerErrorCode = axios\.isAxiosError/,
  "Viewer page should read the backend error code instead of classifying every 403 as an auth error"
);

assert.match(
  source,
  /shouldOpenViewerPurchaseModal\(\{[\s\S]*status: viewerErrorStatus,[\s\S]*code: viewerErrorCode,[\s\S]*isAuthenticated,[\s\S]*episodeId,[\s\S]*productId: hintedProductId,[\s\S]*\}\)/,
  "Viewer page should use the guarded purchase-modal decision with the resumed viewer identifiers"
);

assert.match(
  source,
  /setTypeModal\(TYPE_MODAL\.RENT_OWN,\s*\{[\s\S]*episodeId,[\s\S]*productId: hintedProductId,[\s\S]*\}\)/,
  "Viewer purchase-required handling should open the existing rent/own modal with exact identifiers"
);

assert.match(
  source,
  /shouldAutoOpenViewerPurchaseModal\(\{[\s\S]*autoOpenedEpisodeId: autoOpenedPurchaseEpisodeIdRef\.current[\s\S]*\}\)[\s\S]*autoOpenedPurchaseEpisodeIdRef\.current = episodeId;[\s\S]*handleOpenViewerPurchase\(\)/,
  "Viewer should auto-open the purchase modal only once per resumed episode"
);

assert.match(
  source,
  /shouldOpenPurchaseModal && \([\s\S]*onClick=\{handleOpenViewerPurchase\}[\s\S]*구매하기/,
  "Closing the modal should leave a manual purchase action available"
);

assert.match(
  source,
  /viewerErrorStatus === 403 && !isViewerPurchaseRequired/,
  "Viewer should preserve unrelated 403 responses as auth/access errors"
);

assert.match(
  source,
  /isViewerPurchaseRequired[\s\S]*구매가 필요한 회차입니다\.[\s\S]*구매 후 감상할 수 있습니다\./,
  "Closing the purchase modal should leave accurate purchase-required copy instead of a login error"
);

assert.match(
  source,
  /const isViewerMissingData = !isViewerError && !episodeData/,
  "Viewer page should treat missing data as not-found copy only when there is no HTTP error"
);

assert.match(
  source,
  /const isViewerTransientError =[\s\S]*isViewerError &&[\s\S]*!isViewerPurchaseRequired &&[\s\S]*!isViewerAuthError &&[\s\S]*!isViewerNotFoundError/,
  "Viewer page should classify non-purchase non-auth non-404 viewer errors as transient errors"
);

assert.match(
  source,
  /if \(!isNoticeViewer && isViewerLoading\)[\s\S]*<Spinner \/>/,
  "Viewer page should show a loading state before rendering viewer chrome"
);

assert.match(
  source,
  /if \(!isNoticeViewer && \(isViewerError \|\| !episodeData\)\)[\s\S]*viewerUnavailableTitle[\s\S]*viewerUnavailableMessage/,
  "Viewer page should not render nav/shell when episode data is unavailable and should show status-aware copy"
);

assert.match(
  source,
  /isViewerAuthError && !isAuthenticated[\s\S]*로그인하기/,
  "Viewer page should show the login action only for auth-related viewer errors"
);

assert.match(
  source,
  /isViewerTransientError[\s\S]*refetchViewerPath\(\)[\s\S]*다시 시도/,
  "Viewer page should show retry for transient viewer errors instead of a login action"
);

assert.match(
  source,
  /setLocalStorage\(STORAGE_KEYS\.PREVIOUS_PAGE, currentPath\)[\s\S]*router\.push\("\/login\?modal=open"/,
  "Unavailable viewer login action should preserve the current viewer path before opening login"
);

assert.match(
  source,
  /queryClient\.invalidateQueries\(\{\s*queryKey: \["getCharacterChatCatalog"\],\s*\}\);/,
  "Viewer episode data should invalidate the cached character-chat catalog read progress"
);

const episodeQuerySource = readFileSync(
  existsSync("service/app/api/query/episode/index.ts")
    ? "service/app/api/query/episode/index.ts"
    : "app/api/query/episode/index.ts",
  "utf8"
);

assert.match(
  episodeQuerySource,
  /skipAuthRedirectOn401:\s*true/,
  "Viewer episode query should let React Query receive 401 instead of triggering the global auth reload loop"
);
