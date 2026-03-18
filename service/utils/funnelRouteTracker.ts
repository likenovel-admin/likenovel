import type { ReadonlyURLSearchParams } from "next/navigation";
import { getViewerPageContext } from "@/utils/viewerPageContext";

export type FunnelTrackedPageType = "product_detail" | "viewer" | "other";

export interface FunnelRouteContext {
  rawFullPath: string;
  fullPath: string;
  pathname: string;
  rawSearch: string;
  search: string;
  pageType: FunnelTrackedPageType;
  productId?: number;
  viewerEpisodeId?: number;
  viewerKind?: "episode" | "notice";
  viewerHintProductId?: number;
  changedAt: number;
}

export interface FunnelRouteState {
  previous: FunnelRouteContext | null;
  current: FunnelRouteContext | null;
  updatedAt: number;
}

export type ProductDetailTransitionStatus =
  | "same_funnel"
  | "pending_resume"
  | "pending_viewer_resolution"
  | "exit_candidate";

export interface ProductDetailTransitionDecision {
  sourceProductId: number;
  sourcePath: string;
  destinationPath: string;
  destinationPageType: FunnelTrackedPageType;
  destinationProductId?: number;
  status: ProductDetailTransitionStatus;
  reason:
    | "same_product_detail"
    | "same_product_viewer"
    | "resume_pending_route"
    | "viewer_product_unresolved"
    | "different_product_detail"
    | "different_product_viewer"
    | "other_route";
  evaluatedAt: number;
}

export interface ProductDetailExitCandidate {
  sourceProductId: number;
  sourcePath: string;
  destinationPath: string;
  destinationPageType: FunnelTrackedPageType;
  destinationProductId?: number;
  reason:
    | "different_product_detail"
    | "different_product_viewer"
    | "other_route";
  evaluatedAt: number;
}

interface ResolveFunnelRouteProductIdOptions {
  allowHint?: boolean;
}

const FUNNEL_ROUTE_STATE_KEY = "funnel_route_state";
const PRODUCT_DETAIL_TRANSITION_KEY = "funnel_product_detail_transition";
const PRODUCT_DETAIL_EXIT_CANDIDATE_KEY = "funnel_product_detail_exit_candidate";
const PRODUCT_DETAIL_EXIT_SENT_KEY = "funnel_product_detail_exit_sent_key";
const PRODUCT_DETAIL_PATH_REGEX = /^\/product\/(\d+)$/;
const VIEWER_PATH_REGEX = /^\/viewer\/(\d+)$/;
const VIEWER_INTERNAL_QUERY_KEYS = ["lnr", "productId", "title", "type"];
const RESUME_PENDING_PATH_REGEXES = [
  /^\/login$/,
  /^\/product\/mypage\/cash$/,
  /^\/order\/payment\/complete$/,
];

const normalizePositiveInt = (value?: number | string | null) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  return undefined;
};

export const createFunnelRouteContext = (
  pathname: string,
  searchParams?: URLSearchParams | ReadonlyURLSearchParams
): FunnelRouteContext => {
  const rawSearchString = searchParams?.toString() || "";
  const rawSearch = rawSearchString ? `?${rawSearchString}` : "";
  const rawFullPath = `${pathname}${rawSearch}`;
  const changedAt = Date.now();

  const productMatch = pathname.match(PRODUCT_DETAIL_PATH_REGEX);
  if (productMatch) {
    return {
      rawFullPath,
      fullPath: pathname,
      pathname,
      rawSearch,
      search: "",
      pageType: "product_detail",
      productId: normalizePositiveInt(productMatch[1]),
      changedAt,
    };
  }

  const viewerMatch = pathname.match(VIEWER_PATH_REGEX);
  if (viewerMatch) {
    const viewerEpisodeId = normalizePositiveInt(viewerMatch[1]);
    const viewerKind = searchParams?.get("type") === "notice" ? "notice" : "episode";
    const viewerHintProductId = normalizePositiveInt(
      searchParams?.get("productId")
    );
    const normalizedViewerSearchParams = new URLSearchParams(
      searchParams?.toString() || ""
    );
    VIEWER_INTERNAL_QUERY_KEYS.forEach((key) =>
      normalizedViewerSearchParams.delete(key)
    );
    const normalizedViewerSearchString = normalizedViewerSearchParams.toString();
    const search = normalizedViewerSearchString
      ? `?${normalizedViewerSearchString}`
      : "";

    return {
      rawFullPath,
      fullPath: `${pathname}${search}`,
      pathname,
      rawSearch,
      search,
      pageType: "viewer",
      viewerEpisodeId,
      viewerKind,
      viewerHintProductId,
      changedAt,
    };
  }

  return {
    rawFullPath,
    fullPath: rawFullPath,
    pathname,
    rawSearch,
    search: rawSearch,
    pageType: "other",
    changedAt,
  };
};

export const getFunnelRouteState = (): FunnelRouteState => {
  if (typeof window === "undefined") {
    return { previous: null, current: null, updatedAt: 0 };
  }

  try {
    const raw = sessionStorage.getItem(FUNNEL_ROUTE_STATE_KEY);
    if (!raw) {
      return { previous: null, current: null, updatedAt: 0 };
    }

    const parsed = JSON.parse(raw) as FunnelRouteState;
    return {
      previous: parsed?.previous ?? null,
      current: parsed?.current ?? null,
      updatedAt: parsed?.updatedAt ?? 0,
    };
  } catch (error) {
    console.error("[funnelRouteTracker] read failed", error);
    return { previous: null, current: null, updatedAt: 0 };
  }
};

const setFunnelRouteState = (state: FunnelRouteState) => {
  if (typeof window === "undefined") return false;

  try {
    sessionStorage.setItem(FUNNEL_ROUTE_STATE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("[funnelRouteTracker] write failed", error);
    return false;
  }
};

const getProductDetailTransitionDecision = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(PRODUCT_DETAIL_TRANSITION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProductDetailTransitionDecision;
  } catch (error) {
    console.error("[funnelRouteTracker] product detail transition read failed", error);
    return null;
  }
};

const setProductDetailTransitionDecision = (
  decision: ProductDetailTransitionDecision | null
) => {
  if (typeof window === "undefined") return false;

  try {
    if (!decision) {
      sessionStorage.removeItem(PRODUCT_DETAIL_TRANSITION_KEY);
      return true;
    }

    sessionStorage.setItem(PRODUCT_DETAIL_TRANSITION_KEY, JSON.stringify(decision));
    return true;
  } catch (error) {
    console.error("[funnelRouteTracker] product detail transition write failed", error);
    return false;
  }
};

const setProductDetailExitCandidate = (
  candidate: ProductDetailExitCandidate | null
) => {
  if (typeof window === "undefined") return false;

  try {
    if (!candidate) {
      sessionStorage.removeItem(PRODUCT_DETAIL_EXIT_CANDIDATE_KEY);
      return true;
    }

    sessionStorage.setItem(
      PRODUCT_DETAIL_EXIT_CANDIDATE_KEY,
      JSON.stringify(candidate)
    );
    return true;
  } catch (error) {
    console.error("[funnelRouteTracker] product detail exit candidate write failed", error);
    return false;
  }
};

const getProductDetailExitCandidate = () => {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(PRODUCT_DETAIL_EXIT_CANDIDATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProductDetailExitCandidate;
  } catch (error) {
    console.error("[funnelRouteTracker] product detail exit candidate read failed", error);
    return null;
  }
};

const getLastSentProductDetailExitKey = () => {
  if (typeof window === "undefined") return null;

  try {
    return sessionStorage.getItem(PRODUCT_DETAIL_EXIT_SENT_KEY);
  } catch (error) {
    console.error("[funnelRouteTracker] product detail exit sent key read failed", error);
    return null;
  }
};

const setLastSentProductDetailExitKey = (candidateKey: string | null) => {
  if (typeof window === "undefined") return false;

  try {
    if (!candidateKey) {
      sessionStorage.removeItem(PRODUCT_DETAIL_EXIT_SENT_KEY);
      return true;
    }

    sessionStorage.setItem(PRODUCT_DETAIL_EXIT_SENT_KEY, candidateKey);
    return true;
  } catch (error) {
    console.error("[funnelRouteTracker] product detail exit sent key write failed", error);
    return false;
  }
};

const toProductDetailExitCandidate = (
  decision: ProductDetailTransitionDecision | null
): ProductDetailExitCandidate | null => {
  if (!decision || decision.status !== "exit_candidate") {
    return null;
  }

  if (
    decision.reason !== "different_product_detail" &&
    decision.reason !== "different_product_viewer" &&
    decision.reason !== "other_route"
  ) {
    return null;
  }

  return {
    sourceProductId: decision.sourceProductId,
    sourcePath: decision.sourcePath,
    destinationPath: decision.destinationPath,
    destinationPageType: decision.destinationPageType,
    destinationProductId: decision.destinationProductId,
    reason: decision.reason,
    evaluatedAt: decision.evaluatedAt,
  };
};

export const buildProductDetailExitCandidateKey = (candidate: {
  sourceProductId: number;
  sourcePath: string;
  destinationPath: string;
  evaluatedAt: number;
}) =>
  [
    candidate.sourceProductId,
    candidate.sourcePath,
    candidate.destinationPath,
    candidate.evaluatedAt,
  ].join(":");

const isResumePendingPath = (pathname: string) =>
  RESUME_PENDING_PATH_REGEXES.some((regex) => regex.test(pathname));

const createBaseProductDetailTransitionDecision = (
  sourceProductId: number,
  sourcePath: string,
  current: FunnelRouteContext,
  destinationProductId?: number
) => ({
  sourceProductId,
  sourcePath,
  destinationPath: current.fullPath,
  destinationPageType: current.pageType,
  destinationProductId,
  evaluatedAt: Date.now(),
});

const evaluateProductDetailTransitionDecision = (
  sourceProductId: number,
  sourcePath: string,
  current: FunnelRouteContext
): ProductDetailTransitionDecision => {
  const destinationProductId =
    current.pageType === "viewer"
      ? resolveFunnelRouteProductId(current, {
          allowHint: current.viewerKind === "notice",
        })
      : resolveFunnelRouteProductId(current);
  const base = createBaseProductDetailTransitionDecision(
    sourceProductId,
    sourcePath,
    current,
    destinationProductId
  );

  if (current.pageType === "product_detail") {
    if (destinationProductId === sourceProductId) {
      return {
        ...base,
        status: "same_funnel",
        reason: "same_product_detail",
      };
    }

    return {
      ...base,
      status: "exit_candidate",
      reason: "different_product_detail",
    };
  }

  if (current.pageType === "viewer") {
    if (!destinationProductId) {
      return {
        ...base,
        status: "pending_viewer_resolution",
        reason: "viewer_product_unresolved",
      };
    }

    if (destinationProductId === sourceProductId) {
      return {
        ...base,
        status: "same_funnel",
        reason: "same_product_viewer",
      };
    }

    return {
      ...base,
      status: "exit_candidate",
      reason: "different_product_viewer",
    };
  }

  if (isResumePendingPath(current.pathname)) {
    return {
      ...base,
      status: "pending_resume",
      reason: "resume_pending_route",
    };
  }

  return {
    ...base,
    status: "exit_candidate",
    reason: "other_route",
  };
};

const createProductDetailTransitionDecision = (
  previous: FunnelRouteContext | null,
  current: FunnelRouteContext | null
): ProductDetailTransitionDecision | null => {
  if (!previous || previous.pageType !== "product_detail" || !previous.productId || !current) {
    return null;
  }

  return evaluateProductDetailTransitionDecision(
    previous.productId,
    previous.fullPath,
    current
  );
};

const advancePendingProductDetailTransitionDecision = (
  existingDecision: ProductDetailTransitionDecision | null,
  current: FunnelRouteContext | null
): ProductDetailTransitionDecision | null => {
  if (!existingDecision || !current) {
    return existingDecision;
  }

  if (
    existingDecision.status !== "pending_resume" &&
    existingDecision.status !== "pending_viewer_resolution"
  ) {
    return existingDecision;
  }

  return evaluateProductDetailTransitionDecision(
    existingDecision.sourceProductId,
    existingDecision.sourcePath,
    current
  );
};

export const getLastProductDetailTransitionDecision = () =>
  advancePendingProductDetailTransitionDecision(
    getProductDetailTransitionDecision(),
    getFunnelRouteState().current
  );

export const getLastProductDetailExitCandidate = () =>
  toProductDetailExitCandidate(getLastProductDetailTransitionDecision());

export const isLastProductDetailExitCandidateSent = (
  candidate: ProductDetailExitCandidate
) => getLastSentProductDetailExitKey() === buildProductDetailExitCandidateKey(candidate);

export const peekLastProductDetailExitCandidate = () =>
  getLastProductDetailExitCandidate() ?? getProductDetailExitCandidate();

export const clearLastProductDetailExitCandidate = () => {
  setProductDetailExitCandidate(null);
};

export const clearLastProductDetailTransitionDecision = () => {
  setProductDetailTransitionDecision(null);
};

export const consumeLastProductDetailExitCandidate = () => {
  const candidate = peekLastProductDetailExitCandidate();
  clearLastProductDetailExitCandidate();
  return candidate;
};

export const completeLastProductDetailExitCandidate = (
  candidate: ProductDetailExitCandidate
) => {
  setLastSentProductDetailExitKey(buildProductDetailExitCandidateKey(candidate));
  clearLastProductDetailExitCandidate();
  clearLastProductDetailTransitionDecision();
};

export const syncProductDetailTransitionDecision = () => {
  const currentRouteState = getFunnelRouteState();
  const existingDecision = getProductDetailTransitionDecision();
  const syncedDecision = advancePendingProductDetailTransitionDecision(
    existingDecision,
    currentRouteState.current
  );

  if (syncedDecision === existingDecision) {
    return syncedDecision;
  }

  setProductDetailTransitionDecision(syncedDecision);
  setProductDetailExitCandidate(toProductDetailExitCandidate(syncedDecision));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("funnel:product-detail-transition-synced"));
  }
  return syncedDecision;
};

export const trackFunnelRouteContext = (nextContext: FunnelRouteContext) => {
  const state = getFunnelRouteState();
  const existingDecision = getProductDetailTransitionDecision();

  if (
    state.current?.fullPath === nextContext.fullPath &&
    state.current?.pageType === nextContext.pageType &&
    state.current?.productId === nextContext.productId &&
    state.current?.viewerEpisodeId === nextContext.viewerEpisodeId &&
    state.current?.viewerKind === nextContext.viewerKind
  ) {
    return false;
  }

  const immediateDecision = createProductDetailTransitionDecision(
    state.current,
    nextContext
  );
  const nextDecision =
    immediateDecision ??
    advancePendingProductDetailTransitionDecision(existingDecision, nextContext);

  setProductDetailTransitionDecision(nextDecision);
  setProductDetailExitCandidate(toProductDetailExitCandidate(nextDecision));

  return setFunnelRouteState({
    previous: state.current,
    current: nextContext,
    updatedAt: Date.now(),
  });
};

export const resolveFunnelRouteProductId = (
  routeContext: FunnelRouteContext | null,
  options?: ResolveFunnelRouteProductIdOptions
) => {
  if (!routeContext) return undefined;
  const allowHint = options?.allowHint ?? true;

  if (routeContext.pageType === "product_detail") {
    return routeContext.productId;
  }

  if (
    routeContext.pageType === "viewer" &&
    routeContext.viewerEpisodeId &&
    routeContext.viewerKind
  ) {
    const viewerContext = getViewerPageContext({
      episodeId: routeContext.viewerEpisodeId,
      kind: routeContext.viewerKind,
    });
    if (viewerContext?.resolvedProductId) {
      return viewerContext.resolvedProductId;
    }

    if (!allowHint) {
      return undefined;
    }

    return viewerContext?.hintProductId ?? routeContext.viewerHintProductId;
  }

  return undefined;
};
