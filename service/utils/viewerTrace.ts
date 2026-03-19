type ViewerTraceMeta = Record<string, unknown>;

interface ViewerTraceState {
  id: string;
  startedAt: number;
  pathname?: string;
  episodeId?: number;
  productId?: number;
  seq: number;
}

interface ViewerTraceBufferItem {
  traceId: string;
  seq: number;
  delta: string;
  scope: string;
  event: string;
  data?: ViewerTraceMeta;
}

declare global {
  interface Window {
    __LN_VIEWER_TRACE__?: ViewerTraceState;
    __LN_VIEWER_TRACE_BUFFER__?: ViewerTraceBufferItem[];
  }
}

const TRACE_PREFIX = "[viewer-trace]";
const TRACE_BUFFER_LIMIT = 200;

const isTraceEnabled = () => {
  if (typeof window === "undefined") return false;

  const host = window.location.hostname;
  return host === "localhost" || host.endsWith(".likenovel.dev");
};

const buildTraceId = (episodeId?: number) =>
  `vw-${episodeId ?? "unknown"}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

const canCreateTraceForPath = (pathname?: string) =>
  typeof pathname === "string" && pathname.startsWith("/viewer/");

const formatDelta = (startedAt: number) => {
  if (typeof performance === "undefined") return "+0.0ms";
  return `+${(performance.now() - startedAt).toFixed(1)}ms`;
};

const pushTraceBuffer = (
  state: ViewerTraceState,
  scope: string,
  event: string,
  data?: ViewerTraceMeta
) => {
  if (typeof window === "undefined") return;
  const nextItem: ViewerTraceBufferItem = {
    traceId: state.id,
    seq: state.seq,
    delta: formatDelta(state.startedAt),
    scope,
    event,
    data,
  };

  const current = Array.isArray(window.__LN_VIEWER_TRACE_BUFFER__)
    ? window.__LN_VIEWER_TRACE_BUFFER__
    : [];
  const next = [...current, nextItem].slice(-TRACE_BUFFER_LIMIT);
  window.__LN_VIEWER_TRACE_BUFFER__ = next;
};

const ensureTraceState = (meta?: ViewerTraceMeta) => {
  if (!isTraceEnabled()) return null;

  const pathname =
    typeof meta?.pathname === "string" ? meta.pathname : window.location.pathname;
  const episodeId =
    typeof meta?.episodeId === "number" ? meta.episodeId : undefined;
  const productId =
    typeof meta?.productId === "number" ? meta.productId : undefined;

  const current = window.__LN_VIEWER_TRACE__;
  if (
    current &&
    current.pathname === pathname &&
    (episodeId === undefined || current.episodeId === episodeId)
  ) {
    return current;
  }

  if (!current && !canCreateTraceForPath(pathname)) {
    return null;
  }

  const nextState: ViewerTraceState = {
    id: buildTraceId(episodeId),
    startedAt: typeof performance !== "undefined" ? performance.now() : Date.now(),
    pathname,
    episodeId,
    productId,
    seq: 0,
  };

  window.__LN_VIEWER_TRACE__ = nextState;
  return nextState;
};

export const startViewerTrace = (meta?: ViewerTraceMeta) => {
  const state = ensureTraceState(meta);
  if (!state) return null;

  pushTraceBuffer(state, "viewer-entry", "start", meta || {});

  console.log(
    `${TRACE_PREFIX}[${state.id}][#0][+0.0ms][viewer-entry] start`,
    meta || {}
  );

  return state.id;
};

export const updateViewerTrace = (meta?: ViewerTraceMeta) => {
  if (!isTraceEnabled()) return;
  const state = ensureTraceState(meta);
  if (!state || !meta) return;

  if (typeof meta.pathname === "string") state.pathname = meta.pathname;
  if (typeof meta.episodeId === "number") state.episodeId = meta.episodeId;
  if (typeof meta.productId === "number") state.productId = meta.productId;
}

export const logViewerTrace = (
  scope: string,
  event: string,
  data?: ViewerTraceMeta,
  meta?: ViewerTraceMeta
) => {
  if (!isTraceEnabled()) return;
  const state = ensureTraceState(meta);
  if (!state) return;

  state.seq += 1;
  pushTraceBuffer(state, scope, event, data);
  console.log(
    `${TRACE_PREFIX}[${state.id}][#${state.seq}][${formatDelta(
      state.startedAt
    )}][${scope}] ${event}`,
    data || {}
  );
};

export const endViewerTrace = (reason: string, data?: ViewerTraceMeta) => {
  if (!isTraceEnabled()) return;
  const state = window.__LN_VIEWER_TRACE__;
  if (!state) return;

  state.seq += 1;
  pushTraceBuffer(state, "viewer-entry", `end:${reason}`, data);
  console.log(
    `${TRACE_PREFIX}[${state.id}][#${state.seq}][${formatDelta(
      state.startedAt
    )}][viewer-entry] end:${reason}`,
    data || {}
  );
  window.__LN_VIEWER_TRACE__ = undefined;
};
