interface ViewerPurchaseRequiredResponse {
  status?: number;
  code?: string;
}

interface ViewerPurchaseModalDecision extends ViewerPurchaseRequiredResponse {
  isAuthenticated: boolean;
  episodeId: number;
  productId: number;
}

interface ViewerPurchaseModalAutoOpenDecision {
  shouldOpenPurchaseModal: boolean;
  episodeId: number;
  autoOpenedEpisodeId: number | null;
}

export const isViewerPurchaseRequiredResponse = ({
  status,
  code,
}: ViewerPurchaseRequiredResponse) =>
  status === 403 && code === "PURCHASE_REQUIRED";

export const shouldOpenViewerPurchaseModal = ({
  isAuthenticated,
  episodeId,
  productId,
  ...response
}: ViewerPurchaseModalDecision) =>
  isAuthenticated &&
  Number.isInteger(episodeId) &&
  episodeId > 0 &&
  Number.isInteger(productId) &&
  productId > 0 &&
  isViewerPurchaseRequiredResponse(response);

export const shouldAutoOpenViewerPurchaseModal = ({
  shouldOpenPurchaseModal,
  episodeId,
  autoOpenedEpisodeId,
}: ViewerPurchaseModalAutoOpenDecision) =>
  shouldOpenPurchaseModal &&
  episodeId > 0 &&
  autoOpenedEpisodeId !== episodeId;
