export type AdminDelegatedEpisodeAction = "append_epub" | "replace_epub";

export interface IAdminDelegatedEpisodeSummary {
  product: {
    productId: number;
    title: string;
    authorUserId: number;
    authorName: string | null;
    authorEmail: string | null;
    priceType: string;
    paidOpenDate: string | null;
    paidEpisodeNo: number | null;
    episodeCount: number;
    maxEpisodeNo: number;
  };
}

export interface IAdminDelegatedEpisodeItemRequest {
  episode_no: number;
  title: string;
  epub_file_id: number;
  source_sha256?: string | null;
  author_comment?: string | null;
  evaluation_open_yn: "Y" | "N";
  comment_open_yn: "Y" | "N";
  publish_reserve_yn: "Y" | "N";
  publish_reserve_date?: string | null;
  price_type?: string | null;
}

export interface IAdminDelegatedEpisodeOperationRequest {
  action: AdminDelegatedEpisodeAction;
  episodes: IAdminDelegatedEpisodeItemRequest[];
}

export interface IAdminDelegatedEpisodePreviewItem {
  itemKey: string;
  episodeNo: number;
  episodeId: number | null;
  title: string;
  epubFileId: number;
  sourceSha256: string | null;
  priceType: string;
  textCount: number;
  publishReserveDate: string | null;
  errors: string[];
}

export interface IAdminDelegatedEpisodePreview {
  product: IAdminDelegatedEpisodeSummary["product"];
  action: AdminDelegatedEpisodeAction;
  idempotencyKey: string;
  items: IAdminDelegatedEpisodePreviewItem[];
  errors: string[];
}

export interface IAdminDelegatedEpisodeApplyResult {
  idempotencyKey: string;
  count: number;
  episodeIds: number[];
  items: IAdminDelegatedEpisodePreviewItem[];
}

export interface IAdminDelegatedEpisodeSummaryResponse {
  data: IAdminDelegatedEpisodeSummary;
}

export interface IAdminDelegatedEpisodePreviewResponse {
  data: IAdminDelegatedEpisodePreview;
}

export interface IAdminDelegatedEpisodeApplyResponse {
  data: IAdminDelegatedEpisodeApplyResult;
}
