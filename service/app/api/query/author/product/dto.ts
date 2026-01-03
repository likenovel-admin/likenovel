import { IProduct } from "@/types";

export interface ISelectPresignedFilePathResponse {
  data: { coverImageFileId: number; coverImageUploadPath: string };
}

export interface ISelectGenresResponse {
  data: { genreId: number; genre: string }[];
}

export interface tagObject {
  categoryId: number;
  category: "장르" | "소재" | "캐릭터" | "직업";
  categoryCount: number;
  keywords: string[];
}

export interface ISelectTagResponse {
  data: tagObject[];
}

export interface IMakeProductRequest {
  cover_image_file_id: number | null;
  ongoing_state: "ongoing" | "end" | "stop" | "rest";
  title: string;
  author_nickname: string;
  illustrator_nickname: string | null;
  update_frequency: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  publish_regular_yn: "Y" | "N";
  primary_genre: string;
  sub_genre: string | null;
  keywords: string[] | null;
  custom_keywords: string[] | null;
  synopsis: string;
  adult_yn: "Y" | "N" | "n" | "y";
  open_yn: "Y" | "N";
  monopoly_yn: "Y" | "N";
  cp_contract_yn: "Y" | "N";
}

export interface ISelectEpisodeCountResponse {
  data: { hasEpisodeCount: number };
}

export interface IMakingProductObject {
  productId: number;
  coverImagePath: string;
  ongoingState: "ongoing" | "end" | "stop" | "rest";
  title: string;
  authorNickname: string;
  illustratorNickname: string;
  updateFrequency: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[];
  publishRegularYn: "Y" | "N";
  primaryGenre: string;
  subGenre: string | null;
  keywords: string[];
  customKeywords: string[];
  synopsis: string;
  adultYn: "Y" | "N";
  openYn: "Y" | "N";
  monopolyYn: "Y" | "N";
  cpContractYn: "Y" | "N";
  paidSettingDate: Date | null;
  paidEpisodeNo: number | null;
  priceType: "free" | "paid";
}
export interface ISelectMakingProductResponse {
  data: IMakingProductObject;
}

export interface IUpdateProductRequest extends IMakeProductRequest {
  paid_setting_date: Date | null;
  paid_episode_no: number;
}

export interface ISelectAuthorProductsResponse {
  data: { products: IProduct[] };
}

export interface ISelectMySummaryResponse {
  data: {
    profileId: number;
    profileImagePath: string;
    nickname: string;
    badgeImagePath: string;
    email: string;
    totalViewCount: number;
    totalViewCountIndicator: number;
    totalBookmarkCount: number;
    totalBookmarkCountIndicator: number;
    totalRecommendCount: number;
    totalRecommendCountIndicator: number;
    totalCPViewCount: number;
    totalCPViewCountIndicator: number;
    interestTotalCount: number;
    interestTotalCountIndicator: number;
    interestSustainCount: number;
    interestSustainCountIndicator: number;
    interestLossCount: number;
    interestLossCountIndicator: number;
  };
}
