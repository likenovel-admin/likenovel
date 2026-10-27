export type ExternalDistributionPlatform = "kakaopage" | "ridi";

export interface IExternalDistribution {
  id: number;
  productId: number;
  productTitle: string;
  authorName: string;
  platform: ExternalDistributionPlatform;
  externalId: string;
  externalTitle: string | null;
  externalAuthor: string | null;
  matchMethod: "exact" | "author_similar" | "manual";
  status: "active" | "hidden";
  missCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  openEpisodeCount: number;
  visibleYn: "Y" | "N";
}

export interface IGetExternalDistributionsParams {
  platform?: ExternalDistributionPlatform;
  page: number;
  count_per_page: number;
}

export interface IGetExternalDistributionsResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IExternalDistribution[];
}

export interface IAddExternalDistributionRequest {
  product_id: number;
  platform: ExternalDistributionPlatform;
  external_id: string;
}
