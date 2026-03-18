import { getEpisodeIdFromViewerPathname } from "@/utils/funnelResume";

export type ViewerPageContextStatus = "pending" | "confirmed";
export type ViewerPageContextKind = "episode" | "notice";

export interface ViewerPageContext {
  pageType: "viewer";
  kind: ViewerPageContextKind;
  episodeId: number;
  hintProductId?: number;
  resolvedProductId?: number;
  status: ViewerPageContextStatus;
  updatedAt: number;
}

const VIEWER_PAGE_CONTEXT_PREFIX = "viewer_page_context:";

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

export const getViewerPageContextStorageKey = (
  kind: ViewerPageContextKind,
  episodeId: number
) => `${VIEWER_PAGE_CONTEXT_PREFIX}${kind}:${episodeId}`;

export const getViewerPageContext = (
  input:
    | {
        episodeId?: number | null;
        kind?: ViewerPageContextKind;
      }
    | number
): ViewerPageContext | null => {
  const normalizedInput =
    typeof input === "number" ? { episodeId: input, kind: "episode" as const } : input;
  const normalizedEpisodeId = normalizePositiveInt(normalizedInput?.episodeId);
  const kind = normalizedInput?.kind ?? "episode";
  if (!normalizedEpisodeId || typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(
      getViewerPageContextStorageKey(kind, normalizedEpisodeId)
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ViewerPageContext;
    if (
      parsed?.pageType !== "viewer" ||
      parsed?.kind !== kind ||
      normalizePositiveInt(parsed.episodeId) !== normalizedEpisodeId
    ) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.error("[viewerPageContext] read failed", error);
    return null;
  }
};

const setViewerPageContext = (context: ViewerPageContext) => {
  if (typeof window === "undefined") return false;

  try {
    sessionStorage.setItem(
      getViewerPageContextStorageKey(context.kind, context.episodeId),
      JSON.stringify(context)
    );
    return true;
  } catch (error) {
    console.error("[viewerPageContext] write failed", error);
    return false;
  }
};

export const upsertPendingViewerPageContext = (input: {
  episodeId: number;
  kind?: ViewerPageContextKind;
  hintProductId?: number | string | null;
}) => {
  const normalizedEpisodeId = normalizePositiveInt(input.episodeId);
  if (!normalizedEpisodeId) return false;

  const kind = input.kind ?? "episode";
  const nextHintProductId = normalizePositiveInt(input.hintProductId);
  const existing = getViewerPageContext({
    episodeId: normalizedEpisodeId,
    kind,
  });

  if (
    existing?.resolvedProductId &&
    nextHintProductId &&
    existing.resolvedProductId !== nextHintProductId
  ) {
    console.warn("[viewerPageContext] hint productId mismatch", {
      episodeId: normalizedEpisodeId,
      hintProductId: nextHintProductId,
      resolvedProductId: existing.resolvedProductId,
    });
  }

  const nextContext: ViewerPageContext = existing?.resolvedProductId
    ? {
        ...existing,
        hintProductId: nextHintProductId ?? existing.hintProductId,
        status: "confirmed",
        updatedAt: Date.now(),
      }
    : {
        pageType: "viewer",
        kind,
        episodeId: normalizedEpisodeId,
        hintProductId: nextHintProductId,
        status: "pending",
        updatedAt: Date.now(),
      };

  return setViewerPageContext(nextContext);
};

export const confirmViewerPageContext = (input: {
  episodeId: number;
  kind?: ViewerPageContextKind;
  resolvedProductId: number | string;
  hintProductId?: number | string | null;
}) => {
  const normalizedEpisodeId = normalizePositiveInt(input.episodeId);
  const normalizedResolvedProductId = normalizePositiveInt(input.resolvedProductId);
  if (!normalizedEpisodeId || !normalizedResolvedProductId) {
    return false;
  }

  const kind = input.kind ?? "episode";
  const existing = getViewerPageContext({
    episodeId: normalizedEpisodeId,
    kind,
  });
  const nextHintProductId =
    normalizePositiveInt(input.hintProductId) ?? existing?.hintProductId;

  if (
    nextHintProductId &&
    nextHintProductId !== normalizedResolvedProductId
  ) {
    console.warn("[viewerPageContext] confirmed productId mismatch", {
      episodeId: normalizedEpisodeId,
      hintProductId: nextHintProductId,
      resolvedProductId: normalizedResolvedProductId,
    });
  }

  return setViewerPageContext({
    pageType: "viewer",
    kind,
    episodeId: normalizedEpisodeId,
    hintProductId: nextHintProductId,
    resolvedProductId: normalizedResolvedProductId,
    status: "confirmed",
    updatedAt: Date.now(),
  });
};

export const getViewerPageContextByPathname = (pathname: string) => {
  const episodeId = getEpisodeIdFromViewerPathname(pathname);
  if (!episodeId) return null;
  return getViewerPageContext({ episodeId, kind: "episode" });
};

export const getViewerEffectiveProductId = (
  context: ViewerPageContext | null
) => context?.resolvedProductId ?? context?.hintProductId;
