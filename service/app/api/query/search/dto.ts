import { IEvent, IProduct, IQuest } from "@/types";

export interface SearchFacet {
  id: string;
  label: string;
  group: string;
  count: number;
}

export interface ContentSearchProduct extends IProduct {
  searchMatchReasons: string[];
}

export interface IUseSelectSuggestProductsResponse {
  data: IProduct[];
}

export interface IUseSelectSearchResultResponse {
  data: {
    products: ContentSearchProduct[];
    events: IEvent[];
    quests: IQuest[];
    facets: SearchFacet[];
    selectedTags: Omit<SearchFacet, "count">[];
    totalCount: number;
    page: number;
    pageSize: number;
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
