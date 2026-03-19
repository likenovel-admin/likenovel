type ProductTraceMeta = Record<string, unknown>;

interface ProductTraceState {
  id: string;
  startedAt: number;
  pathname?: string;
  productId?: number;
  seq: number;
}

interface ProductTraceBufferItem {
  traceId: string;
  seq: number;
  delta: string;
  scope: string;
  event: string;
  data?: ProductTraceMeta;
}

declare global {
  interface Window {
    __LN_PRODUCT_TRACE__?: ProductTraceState;
    __LN_PRODUCT_TRACE_BUFFER__?: ProductTraceBufferItem[];
  }
}

const TRACE_PREFIX = "[product-trace]";
const TRACE_BUFFER_LIMIT = 120;

const isTraceEnabled = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host.endsWith(".likenovel.dev");
};

const buildTraceId = (productId?: number) =>
  `pd-${productId ?? "unknown"}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

const canCreateTraceForPath = (pathname?: string) =>
  typeof pathname === "string" && pathname.startsWith("/product/");

const formatDelta = (startedAt: number) => {
  if (typeof performance === "undefined") return "+0.0ms";
  return `+${(performance.now() - startedAt).toFixed(1)}ms`;
};

const pushTraceBuffer = (
  state: ProductTraceState,
  scope: string,
  event: string,
  data?: ProductTraceMeta
) => {
  if (typeof window === "undefined") return;
  const nextItem: ProductTraceBufferItem = {
    traceId: state.id,
    seq: state.seq,
    delta: formatDelta(state.startedAt),
    scope,
    event,
    data,
  };

  const current = Array.isArray(window.__LN_PRODUCT_TRACE_BUFFER__)
    ? window.__LN_PRODUCT_TRACE_BUFFER__
    : [];
  window.__LN_PRODUCT_TRACE_BUFFER__ = [...current, nextItem].slice(
    -TRACE_BUFFER_LIMIT
  );
};

const ensureTraceState = (meta?: ProductTraceMeta) => {
  if (!isTraceEnabled()) return null;

  const pathname =
    typeof meta?.pathname === "string" ? meta.pathname : window.location.pathname;
  const productId =
    typeof meta?.productId === "number" ? meta.productId : undefined;

  const current = window.__LN_PRODUCT_TRACE__;
  if (
    current &&
    current.pathname === pathname &&
    (productId === undefined || current.productId === productId)
  ) {
    return current;
  }

  if (!current && !canCreateTraceForPath(pathname)) {
    return null;
  }

  const nextState: ProductTraceState = {
    id: buildTraceId(productId),
    startedAt: typeof performance !== "undefined" ? performance.now() : Date.now(),
    pathname,
    productId,
    seq: 0,
  };

  window.__LN_PRODUCT_TRACE__ = nextState;
  return nextState;
};

export const startProductTrace = (meta?: ProductTraceMeta) => {
  const state = ensureTraceState(meta);
  if (!state) return null;

  pushTraceBuffer(state, "product-entry", "start", meta || {});
  console.log(
    `${TRACE_PREFIX}[${state.id}][#0][+0.0ms][product-entry] start`,
    meta || {}
  );
  return state.id;
};

export const updateProductTrace = (meta?: ProductTraceMeta) => {
  if (!isTraceEnabled()) return;
  const state = ensureTraceState(meta);
  if (!state || !meta) return;

  if (typeof meta.pathname === "string") state.pathname = meta.pathname;
  if (typeof meta.productId === "number") state.productId = meta.productId;
};

export const logProductTrace = (
  scope: string,
  event: string,
  data?: ProductTraceMeta,
  meta?: ProductTraceMeta
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

export const endProductTrace = (reason: string, data?: ProductTraceMeta) => {
  if (!isTraceEnabled()) return;
  const state = window.__LN_PRODUCT_TRACE__;
  if (!state) return;

  state.seq += 1;
  pushTraceBuffer(state, "product-entry", `end:${reason}`, data);
  console.log(
    `${TRACE_PREFIX}[${state.id}][#${state.seq}][${formatDelta(
      state.startedAt
    )}][product-entry] end:${reason}`,
    data || {}
  );
  window.__LN_PRODUCT_TRACE__ = undefined;
};
