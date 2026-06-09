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
