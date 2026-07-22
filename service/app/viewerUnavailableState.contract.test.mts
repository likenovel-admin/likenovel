import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

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
  /const isViewerMissingData = !isViewerError && !episodeData/,
  "Viewer page should treat missing data as not-found copy only when there is no HTTP error"
);

assert.match(
  source,
  /const isViewerTransientError =\s*isViewerError && !isViewerAuthError && !isViewerNotFoundError/,
  "Viewer page should classify non-auth non-404 viewer errors as transient errors"
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
  /viewerErrorCode === ErrorCodes\.E4013/,
  "Viewer page should identify the dedicated guest episode-limit response"
);

assert.match(
  source,
  /여기서부터는 로그인하고 볼 수 있어요[\s\S]*3초 만에 시작하기[\s\S]*이미 회원이라면 로그인/,
  "Guest episode-limit state should render its dedicated signup and login actions"
);

assert.match(
  source,
  /setLocalStorage\(STORAGE_KEYS\.PREVIOUS_PAGE, currentPath\)[\s\S]*router\.push\("\/sign-up"\)/,
  "Guest episode-limit signup action should preserve the viewer path"
);

assert.match(
  source,
  /data\?\.data\?\.episodeNo !== 5[\s\S]*sessionStorage\.getItem\(GUEST_LIMIT_NOTICE_DISMISSED_KEY\)/,
  "Guest limit notice should only appear on episode five and honor session dismissal"
);

assert.match(
  source,
  /다음 화부터는 로그인이 필요해요 · 무료 회차는 로그인하면 계속 무료[\s\S]*aria-label="안내 배너 닫기"/,
  "Episode five should show the dismissible pre-notice copy"
);

// ViewerBottomNav은 fixed bottom-0 z-50 h-[60px]로 깔린다. 배너가 그보다 낮은
// z-index나 낮은 위치에 있으면 하단바가 포인터 이벤트를 가로채 닫기 버튼을 누를 수 없다.
assert.match(
  source,
  /aria-live="polite"[\s\S]{0,400}z-\[60\]/,
  "Guest limit notice must stack above ViewerBottomNav (z-50) so the close button stays clickable"
);

assert.match(
  source,
  /showNav && !noticeState[\s\S]{0,120}bottom-\[calc\(76px\+env\(safe-area-inset-bottom\)\)\][\s\S]{0,80}bottom-16pxr/,
  "Guest limit notice must clear the bottom nav height while it is visible"
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
