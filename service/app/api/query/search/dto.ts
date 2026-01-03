import { IEvent, IProduct, IQuest } from "@/types";

export interface IUseSelectSuggestProductsResponse {
  data: IProduct[];
}

export interface IUseSelectSearchResultResponse {
  data: {
    products: IProduct[];
    events: IEvent[];
    quests: IQuest[];
  };
}

export interface IUseSelectSearchProductReviewResponse {
  data: IProduct[];
}

export interface IUseSelectTrendingKeywordsResponse {
  data: string[];
}

export interface IUseSelectWeeklyMostSearchedResponse {
  data: IProduct[];
}

export interface IUseSelectProductSuggestByRecentViewedResponse {
  data: IProduct[];
}
