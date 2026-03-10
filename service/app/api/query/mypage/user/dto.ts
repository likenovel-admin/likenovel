import { IComment } from "@/components/common/CommentArea";
import { ICash, IProductsContractOffered, IRentalTicket, IRole } from "@/types";

export interface UserInfoObject {
  profileId: number;
  birthDate: string;
  userProfileImagePath: string;
  userNickname: string;
  userInterestLevelBadgeImagePath: string;
  userEventLevelBadgeImagePath: string;
  userRole: IRole;
  identityYn: "Y" | "N";
  email: string;
  totalCash: number;
  totalTicket: number;
  totalInterestSustainCount: number;
  totalVoteWinCount: number;
  totalVoteRound: number;
  totalReadProductCount: number;
  totalWrittenProductCount: number;
  applyCPEditorYN: "Y" | "N";
}

export interface ISelectUserInfoResponse {
  data: UserInfoObject;
}

export interface ISelectProfileFileResponse {
  data: {
    profileImageFileId: number;
    profileImageUploadPath: string;
  };
}

// export interface INiceTokenResponse {
//   access_token: string;
//   token_type: string;
//   expires_in: number;
//   scope: string;
// }

export interface IUserContractOffer {
  offer_id: number;
  offer_user_id: number;
  author_user_id: number;
  offerer_profile_image_path: string;
  offerer_nickname: string;
  offer_message: string;
  offer_price: number;
  offer_profit: number;
  author_profit: number;
  cover_image_path: string;
  title: string;
  author_accept_yn: "Y" | "N" | null;
  use_yn: "Y" | "N";
  updated_date: string; // ISO datetime string
  userEventLevelBadgeImagePath: string;
}

export interface ISelectUserContractOfferResponse {
  data: IUserContractOffer[];
}

// Common aliases
type YN = "Y" | "N";
type PriceType = "free" | "paid";
type ProductType = "free" | "paid";
type PromotionType = "free-for-first" | "reader-of-prev";
type PromotionStatus = "pending" | "ing" | "stop" | "end";
type OngoingState = "ongoing" | "paused" | "ended";
type ConvertToPaidState =
  | "not_applied"
  | "applied"
  | "approved"
  | "rejected"
  | "review";
type OfferDecisionState = "review" | "approved" | "rejected";
type DateTimeString = string; // keep as string for flexibility

export interface ImageBlock {
  coverImagePath: string;
  adultDefaultcoverImagePath: string;
}

export interface BadgeBlock {
  /** Note: boolean in this API (not Y/N) */
  episodeUploadYn: boolean;
  waitingForFreeYn: YN;
  sixNinePathYn: YN;
  newReleaseYn: YN;
  freeEpisodeTicketCount: number;
  authorEventLevelBadgeImagePath: string;
  authorInterestLevelBadgeImagePath: string;
  interestFireActiveImagePath: string;
  interestFireFadeImagePath: string;
  /** e.g., "1970-01-04" */
  interestEndDate: string;
}

export interface TrendIndex {
  readThroughRate: number;
  readThroughIndicator: number;
  cpHitCount: number;
  cpHitIndicator: number;
  totalInterestCount: number;
  totalInterestIndicator: number;
  interestSustainCount: number;
  interestSustainIndicator: number;
  interestLossCount: number;
  interestLossIndicator: number;
  hitCount: number;
  hitIndicator: number;
  recommendCount: number;
  recommendIndicator: number;
  bookmarkCount: number;
  bookmarkIndicator: number;
  hasEpisodeCount: number;
  readedEpisodeCount: number;
  primaryReaderGroup: string;
}

export interface PropertiesBlock {
  updateFrequency: string;
  averageWeeklyEpisodes: number;
  latestEpisodeDate: DateTimeString;
  bookmarkYn: YN;
}

export interface ContractBlock {
  monopolyYn: YN;
  cpContractYn: YN;
  advancePayment: number;
  totalSales: number;
  offerCount: number;
  offerId: string;
  offerUserRole: "CP" | "author" | string;
  offerDate: string; // empty string if none
  offerAdvancePayment: number | null;
  settlementRatioSnippet: string;
  offerDecisionState: OfferDecisionState;
}

export interface StateBlock {
  ongoingState: OngoingState;
  convertToPaidState: ConvertToPaidState;
  canApplyForPaid: boolean;
}

interface PromotionBase {
  id: number;
  product_id: number;
  start_date: DateTimeString;
  type: PromotionType;
  status: PromotionStatus;
  num_of_ticket_per_person: number;
  created_id: number | null;
  created_date: DateTimeString;
  updated_id: number | null;
  updated_date: DateTimeString;
}

export type DirectPromotion = PromotionBase;

export interface AppliedPromotion {
  id: number;
  product_id: number;
  type: string;
  status: string;
  start_date: string; // ISO string, could be Date type if parsed to Date
  end_date: string; // ISO string, could be Date type if parsed to Date
  num_of_ticket_per_person: number;
  created_id: number;
  created_date: string; // ISO string, could be Date type if parsed to Date
  updated_id: number | null;
  updated_date: string | null; // ISO string, could be Date type if parsed to Date
  can_apply_text: string;
  remaining_slots: number;
}

export interface IUserProductsWithPromotion {
  productId: number;
  adultYn: YN;
  title: string;
  synopsis: string;
  authorNickname: string;
  priceType: PriceType;
  illustratorNickname: string | null;
  productType: ProductType;
  createdDate: DateTimeString;
  updatedDate: DateTimeString;
  authorId: number;
  keywords: string[];
  primary_genre: string | null;
  sub_genre: string | null;
  current_rank: number | null;
  rank_indicator: number | null;
  waitingForFreeStatus: string | null;
  sixNinePathStatus: string | null;
  primaryReaderGroup: string | null;
  advancePayment: number | null;
  offerId: number | null;
  offerDate: DateTimeString | null;
  settlementRatioSnippet: string | null;
  offerDecisionState: OfferDecisionState | null;

  genre: string[];
  /** Backend returns an object; leave extensible */
  rank: Record<string, unknown>;

  image: ImageBlock;
  badge: BadgeBlock;
  trendindex: TrendIndex;
  properties: PropertiesBlock;
  contract: ContractBlock;
  state: StateBlock;

  directPromotions: DirectPromotion[];
  appliedPromotions: AppliedPromotion[];
}

export interface ISelectUserProductsWithPromotionsResponse {
  data: { products: IUserProductsWithPromotion[] };
}

interface IProfile {
  profileId: number;
  userProfileImagePath: string;
  userNickname: string;
  userInterestLevelBadgeImagePath: string;
  userEventLevelBadgeImagePath: string;
  userRole: "user" | "admin" | string;
  defaultYn: "Y" | "N";
  nicknameChangeableCount: number;
}

export interface ISelectUserProfilesResponse {
  data: IProfile[];
}

export interface ISelectUserProfileDetailResponse {
  data: IProfile;
}

export interface IProfileRequest {
  user_nickname?: string;
  event_badge_yn?: "Y" | "N";
  interest_badge_yn?: "Y" | "N";
  default_yn?: "Y" | "N";
  profile_image_file_id?: number;
}

export interface ISelectUserCashResponse {
  data: ICash[];
}

export interface ISelectUserCommentResponse {
  data: IComment[];
}

export interface ICommentBlock {
  commentId: number;
  reviewId: number;
  userId: number;
  userNickname: string;
  userProfileImagePath: string; // URL
  userInterestLevelBadgeImagePath: string; // URL
  userEventLevelBadgeImagePath: string; // URL
  publishDate: string;
  commentType: "product-review" | "episode" | "review" | string;
}

export interface ISelectUserCommentBlockResponse {
  data: ICommentBlock[];
}

export interface ISelectUserNotificationSettingsResponse {
  data: {
    benefit: "Y" | "N";
    comment: "Y" | "N";
    system: "Y" | "N";
    event: "Y" | "N";
    marketing: "Y" | "N";
  };
}

export interface ISelectUserProductContractOfferedResponse {
  data: IProductsContractOffered[];
}

export interface ISelectUserProductTicketResponse {
  data: IRentalTicket[];
}

export interface ISelectUserPromotionIssuanceStatusResponse {
  issued_this_week: boolean;
  last_issued_date: string | null;
  last_issued_count: number;
  this_week_issued_date: string | null;
  this_week_issued_count: number;
  next_available_date: string | null;
}
