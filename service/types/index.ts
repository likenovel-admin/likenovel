import { ErrorCodes } from "../enums/errorCodes";

export interface IUser {
  userId: number;
  birthDate: string;
  gender: string;
  isAdult: boolean;
  isOnAdult?: boolean;
  userRole: IRole;
  recentSignInType?: ISocialLoginProvider;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export type ISocialLoginProvider =
  | "naver"
  | "kakao"
  | "google"
  | "apple"
  | "likenovel";

export type IRole = "user" | "author" | "CP" | "editor" | "enter" | "admin";

export type IUpdateFrequency = {
  [day: string]: "Y" | "N";
};

export interface ICustomError {
  response: {
    status: number;
    data?: {
      code?: ErrorCodes;
    };
  };
}

// 기존 타입 (삭제 예정)
export interface IOriginProduct {
  productId: number;
  division: string;
  area: string;
  adultYn: "Y" | "N"; // 성인물 여부
  title: string;
  rank?: {
    currentRank?: number;
    rankIndicator?: number; // 순위 지표
  };
  genre?: string[];
  synopsis?: string;
  coverImagePath: string;
  adultDefaultcoverImagePath?: string;
  priceType?: "free" | "paid"; // 가격 타입
  episodeUploadYn: "Y" | "N"; // 에피소드 업로드 여부
  newReleaseYn: "Y" | "N"; // 신작 여부
  waitForFreeYn: "Y" | "N"; // 프로모션: 기다무 이용권 추가 여부
  freeEpisodes?: number; // 프로모션: 첫 방문자에게 부여하는 무료 이용권 수
  timepassFromTo?: string; // 프로모션: 타임패스 시작 및 종료 시간
  authorNickname?: string;
  authorInterestLevelBadgeImagePath?: string;
  authorEventLevelBadgeImagePath?: string;
  illustratorNickname?: string;
  keywords?: string[];
  properties?: {
    latestEpisodeDate?: string; // 최신 에피소드 날짜
  };
  monopolyYn: "Y" | "N"; // 독점 여부
  cpContractYn: "Y" | "N"; // 계약 여부
  readingRate: number; // 독서 비율
  writingCountPerWeek: number; // 주당 작성 수
  primaryReaderGroup?: Record<string, string>; // 주 독자 그룹
  bookmarkYn: "Y" | "N"; // 북마크 여부
  episodeCount: number; // 총 에피소드 수
  updateFrequency?: string; // 업데이트 주기
  remarkContentSnippet?: string; // 리마크 내용 스니펫
  interestFireImagePath?: string; // 관심 이미지 경로
  interestEndDate?: string; // 관심 종료일
  advancePayment?: number; // 선인세
  offerCount?: number; // 제안 수
  offerId?: number; // 제안 ID
  offerUserRole?: IRole; // 제안 사용자 역할
  hitCount?: number; // 조회수
  hitIndicator?: number; // 히트 지표
  recommendCount?: number; // 추천 수
  recommendIndicator?: number; // 추천 지표
  bookmarkCount?: number; // 북마크 수
  bookmarkIndicator?: number; // 북마크 지표
  cpHitCount?: number; // CP 히트 수
  cpHitIndicator?: number; // CP 히트 지표
  readThroughRate?: number; // 완독률
  readThroughIndicator?: number; // 완독률 지표
  totalInterestCount?: number; // 총 관심 수
  totalInterestIndicator?: number; // 총 관심 지표
  interestSustainCount?: number; // 관심 지속 수
  interestSustainIndicator?: number; // 관심 지속 지표
  interestLossCount?: number; // 관심 감소 수
  interestLossIndicator?: number; // 관심 감소 지표
  averageWeeklyEpisodes?: number; // 주 평균 연재횟수
  productType?: "free" | "normal"; // 무료 제품 상태: 자유(일반 승급 신청) / 일반(유료 전환 신청)
  convertToPaidState?: "review" | "approval" | "reject"; // 유료작품 심사 상태
  ongoingState: "ongoing" | "rest" | "end" | "stop"; // 연재 상태
  readedEpisodeCount?: number; // 읽은 에피소드 수
  hasEpisodeCount?: number; // 총 에피소드 수
  commentCount?: number; // 댓글 수
  evaluationCount?: number; // 평가 수
}

export interface IRank {
  currentRank: number;
  rankIndicator: number;
}

export interface IImage {
  coverImagePath: string;
  adultDefaultcoverImagePath: string;
}

export interface IBadge {
  waitForFreeYn: "Y" | "N";
  episodeUploadYn: "Y" | "N";
  timepassFromTo: string;
  newReleaseYn: "Y" | "N";
  freeEpisodeTicketCount: number;
  authorEventLevelBadgeImagePath: string;
  authorInterestLevelBadgeImagePath: string;
  interestFireActiveImagePath: string;
  interestFireFadeImagePath: string;
  interestEndDate?: string;
  sixNinePathYn: "Y" | "N";
  waitingForFreeYn: "Y" | "N";
}

export interface ITrendIndex {
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
  notRecommendCount: number;
  notRecommendIndicator: number;
  bookmarkCount: number;
  bookmarkIndicator: number;
  hasEpisodeCount: number;
  readedEpisodeCount: number;
  primaryReaderGroup: string;
}

export interface IProperties {
  updateFrequency: string;
  averageWeeklyEpisodes: number;
  remarkContentSnippet: string;
  latestEpisodeDate: string;
  bookmarkYn?: "Y" | "N";
}

export interface IContract {
  monopolyYn: "Y" | "N"; // 독점 여부
  cpContractYn: "Y" | "N"; // CP 계약 여부
  advancePayment: number; // 선급금
  totalSales: number; // 총 판매액
  offerCount: number; // 제안 횟수
  offerId: string; // 제안 ID
  offerUserRole: "CP" | "author" | "other"; // 제안자 역할 (CP, 작가, 기타)
  offerDate: string; // 제안 날짜 (ISO 형식)
  offerAdvancePayment: string | null; // 제안된 선급금 (빈 값일 수 있음)
  settlementRatioSnippet: string; // 정산 비율 설명
  offerDecisionState: "review" | "approval" | "reject"; // 제안 결정 상태
}

export interface IState {
  ongoingState: "ongoing" | "rest" | "end" | "stop"; // 연재 상태
  convertToPaidState: "review" | "approval" | "rejected" | "not_applied"; // 유료 전환 상태
  canApplyForPaid: boolean;
}

export type ProductInterestStatus =
  | "interest_active"
  | "interest_ending_soon"
  | "no_interest";

export interface IProduct {
  productId: number;
  division?: string;
  area?: string;
  adultYn?: "Y" | "N";
  title: string;
  synopsis?: string;
  rank: IRank;
  genre: string[];
  authorNickname: string;
  keywords: string[];
  image: IImage;
  badge?: IBadge;
  priceType: "free" | "paid";
  illustratorNickname?: string;
  trendindex?: ITrendIndex;
  properties?: IProperties;
  contract?: IContract;
  productType?: "free" | "normal" | "paid"; // 무료 제품 상태: 자유(일반 승급 신청) / 일반(유료 전환 신청)
  state?: IState;
  createdDate?: string;
  updatedDate?: string;
  authorId: number;
  privateYn?: "Y" | "N";
  remainingNotificationCount: number;
  interestStatus: ProductInterestStatus;
  bookmarkCreatedDate?: string;
  latestEpisodeNo?: number;
  firstEpisodeId?: number;
  latestEpisodeId?: number;
  // recent viewed product specific fields
  coverImagePath?: string;
  authorName?: string;
  latestEpisodeDate?: string;
  interestEndDate?: string;
  authorEventLevelBadgeImagePath?: string;
  singleRegularPrice?: number;
  singleRentalPrice?: number;
  seriesRegularPrice?: number;
  publishRegularYn?: "Y" | "N";
  totalOpenEpisodeCount: number;
  readedEpisodeCount?: number;
}

export interface IPublisherPromotionProduct {
  productId: number;
  adultYn: "Y" | "N";
  title: string;
  synopsis: string;
  authorNickname: string;
  priceType: "free" | "paid";
  illustratorNickname: string | null;
  productType: "normal" | "free";
  createdDate: string;
  updatedDate: string;
  authorId: number;
  keywords: string[] | null;
  primary_genre: string | null;
  sub_genre: string | null;
  current_rank: number | null;
  rank_indicator: number | null;
  coverImagePath: string;
  image: {
    adultDefaultcoverImagePath: string;
    coverImagePath: string;
  };
  waitForFreeYn: "Y" | "N";
  count_hit: number;
  count_cp_hit: number;
  count_recommend: number;
  count_bookmark: number;
  hasEpisodeCount: number;
  publish_days: string; // JSON string like "{\"SAT\":\"Y\"}"
  last_episode_date: string;
  bookmarkYn: "Y" | "N";
  monopoly_yn: "Y" | "N";
  contract_yn: "Y" | "N";
  status_code: "ongoing" | "rest" | "end" | "stop" | string;
  count_like: number;
  area?: "freeTop" | "paidTop" | string;
}

export type IReviewRating =
  | "highly-positive"
  | "very-positive"
  | "positive"
  | "some-what-positive"
  | "neutral"
  | "some-what-negative"
  | "negative"
  | "very-negative"
  | "highly-negative";

export interface IEpisode {
  episodeId: number; // 에피소드 ID
  productId: number; // 상품 ID
  episodeNo: number; // 회차 번호
  episodeTitle: string; // 에피소드 제목
  episodeTextCount: number; // 에피소드 텍스트 개수
  episodeContent: string; // 에피소드 내용
  authorComment: string; // 작가 코멘트
  commentOpenYn: "Y" | "N"; // 댓글 공개 여부
  countEvaluation: number; // 평가 개수
  createdId: string; // 생성자 ID
  createdDate: string; // 생성 날짜 (ISO 형식)
  updatedId: string; // 수정자 ID
  updatedDate: string; // 수정 날짜 (ISO 형식)
  countComment: number; // 댓글 개수
  priceType: "free" | "paid"; // 가격 유형 (무료 또는 유료)
  evaluationOpenYn: "Y" | "N"; // 평가 공개 여부
  publishReserveDate: string; // 예약 공개 날짜 (ISO 형식)
  openYn: "Y" | "N"; // 공개 여부
  useYn: "Y" | "N"; // 사용 여부
  countHit: number; // 조회수
  countRecommend: number; // 추천수
  countLike: number; // 좋아요 수
  countView: number; // 조회수
  epubFileId: number; // ePub 파일 ID
  epubFilePath: string; // ePub 파일 경로

  countEvaluationIndicator: number;
  countCommentIndicator: number;
  countHitIndicator: number;
  countRecommendIndicator: number;
  episodeOpenYn: YesNo;
  countLikeIndicator: number;
  ownType: "rental" | "own" | string;
}

export type IEvaluation = Record<IReviewRating, number>;

export interface INotice {
  episodeId: number;
  productId: number;
  episodeNo: number; // 에피소드 번호
  noticeId: number; // 공지 ID
  type: "normal" | "important"; // 공지 유형
  subject: string; // 제목
  content: string; // 내용
  primaryYn: "Y" | "N"; // 주요 여부
  openYn: "Y" | "N"; // 공개 여부
  useYn: "Y" | "N"; // 사용 여부
  countHit: number; // 조회수
  createdId: string; // 생성자 ID
  createdDate: string; // 생성 일자 (ISO 형식)
  updatedId: string; // 수정자 ID
  updatedDate: string; // 수정 일자 (ISO 형식)
  publish_reserve_date: string | null;
  created_date: string;
  updated_date: string;
  open_yn: "Y" | "N";
  id: number;
  product_id: number;
  user_id: number;
  use_yn: YesNo;
  created_id: number;
  updated_id: number;
}

export interface IEvent {
  eventId: number;
  eventTitle: string;
  eventContent: string;
}

export interface IQuest {
  questId: number;
  questTitle: string;
  questContent: string;
}

type YesNo = "Y" | "N";
export interface IRollingNotice {
  id: number;
  subject: string;
  content: string;
  primary_yn: YesNo;
  use_yn: YesNo;
  view_count: number;
  file_id: number;
  created_id: number;
  created_date: string;
  updated_id: number | null;
  updated_date: string | null;
}

export interface IGift {
  id: number;
  user_id: number;
  ticket_item_id: number;
  read_yn: "Y" | "N";
  received_yn: "Y" | "N";
  received_date: string; // ISO datetime string
  reason: string;
  amount: number;
  created_id: number | null;
  created_date: string; // ISO datetime string
  updated_id: number | null;
  updated_date: string; // ISO datetime string
}

export interface IEvent {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  type: string;
  target_product_ids: string | number[];
  reward_type: string;
  reward_amount: number;
  reward_max_people: number;
  show_yn_thumbnail_img: "Y" | "N";
  show_yn_detail_img: "Y" | "N";
  show_yn_product: "Y" | "N";
  show_yn_information: "Y" | "N";
  thumbnail_image_id: number;
  detail_image_id: number;
  account_name: string;
  product_ids: string | number[];
  information: string;
  created_id: number;
  created_date: string;
  updated_id: number;
  updated_date: string;
  thumbnail_image_path: string;
  detail_image_path: string | null;
}

export interface IProductReview {
  id: number;
  productId: number;
  episodeId: number;
  userId: number;
  reviewText: string;
  reviewTitle?: string;
  createdDate: string;
  updatedDate: string;

  reviewer: {
    profileId: number;
    nickname: string;
    profileImagePath: string; // URL
    userInterestLevelBadgeImagePath: string; // URL
    userEventLevelBadgeImagePath: string; // URL
    userRole: string;
  };

  likesCount: number;
  liked: boolean;
  commentsCount: number;
  commented: boolean;
}

export interface ICommentProductReview {
  id: number;
  reviewId: number;
  userId: number;
  commentText: string;
  createdDate: string; // ISO datetime string
  updatedDate: string; // ISO datetime string
  commenter: {
    profileId: number;
    nickname: string;
    profileImagePath: string;
    userInterestLevelBadgeImagePath: string;
    userEventLevelBadgeImagePath: string;
    userRole: string;
  };
}

export interface IQuest {
  quest_id: number;
  title: string;
  reward_id: number;
  end_date: string; // ISO datetime
  goal_stage: number;
  use_yn: "Y" | "N";
  renewal: {
    MON: "Y" | "N";
    TUE: "Y" | "N";
    WED: "Y" | "N";
    THU: "Y" | "N";
    FRI: "Y" | "N";
    SAT: "Y" | "N";
    SUN: "Y" | "N";
  };
  created_id: number;
  created_date: string;
  updated_id: number;
  updated_date: string;
  reward_own_yn: "Y" | "N";
  current_stage: {
    useYn: "Y" | "N";
    count_process: number;
    count_ticket: number;
  };
  progress: {
    current_stage: number;
    current_process: number;
  };
}

export interface ICash {
  category: "charge" | "used";
  amount: number;
  product_title: string;
  episode_title: string;
  created_date: string;
}

export interface IProductsContractOffered {
  offer_id: number;
  cover_image_path: string;
  title: string;
  author_name: string;
  author_user_id: number;
  illustrator_name: string | null;
  created_date: string;
  waiting_for_free_yn: "Y" | "N";
  six_nine_path_yn: "Y" | "N";
  offer_price: number;
  offer_profit: number;
  author_profit: number;
  author_accept_yn: "Y" | "N";
  use_yn: "Y" | "N";
}

export interface IChatRoom {
  room_id: number;
  other_user_profile_id: number;
  other_user_nickname: string;
  other_user_profile_image_path: string;
  other_user_interest_level_badge_image_path: string;
  last_message_content: string;
  last_message_date: string; // ISO 8601 datetime string
  unread_message_count: number;
  is_active: "Y" | "N";
}

export interface IMessage {
  message_id: number;
  room_id: number;
  sender_user_id: number;
  content: string;
  is_read: "Y" | "N";
  created_date: string; // ISO 8601 datetime string
}

export type RentalTicketSource =
  | "first_visitor"
  | "early_reader"
  | "wait_for_free"
  | "six_to_nine_pass"
  | "event";

export interface IRentalTicket {
  id: number;
  ticket_type: "rental" | string;
  type: string;
  own_type: "rental" | string;
  rental_source?: RentalTicketSource;
  user_id: number;
  profile_id: number;
  product_id: number;
  episode_id: number;
  rental_expired_date: string;
  use_yn: "Y" | "N";
  created_date: string;
  updated_date: string;
}
