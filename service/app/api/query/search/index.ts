import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import { contentSearchParams, type ContentSearchState } from "@/utils/contentSearch";
import {
  IUseSelectProductSuggestByRecentViewedResponse,
  IUseSelectSearchProductReviewResponse,
  IUseSelectSearchResultResponse,
  IUseSelectSuggestProductsResponse,
  IUseSelectTrendingKeywordsResponse,
  IUseSelectWeeklyMostSearchedResponse,
} from "./dto";

export const useSelectAutoComplete = (keyword: string, adult_yn: string) => {
  return useQuery<IUseSelectSuggestProductsResponse, unknown>({
    queryKey: ["selectAutoComplete", keyword, adult_yn],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/search/autocomplete?keyword=${keyword}&adult_yn=${
          adult_yn || "N"
        }`
      );

      return response.data;
    },
    enabled: !!keyword,
  });
};

export const useSelectSearchResult = (
  state: ContentSearchState,
  adultYn: string,
  authSessionVersion: number,
  limit = 10
) => useQuery<IUseSelectSearchResultResponse>({
  queryKey: ["selectSearchResult", state, adultYn, authSessionVersion, limit],
  throwOnError: false,
  retry: 1,
  queryFn: async ({ signal }) => {
    const params = contentSearchParams(state);
    params.set("adult_yn", adultYn);
    params.set("limit", String(limit));
    const response = await instance.get(`/v1/query/search?${params}`, { signal });
    return response.data;
  },
});

export const useSelectSearchProductReview = (
  keyword: string,
  adult_yn: string,
  limit?: number
) => {
  return useQuery<IUseSelectSearchProductReviewResponse, unknown>({
    queryKey: ["selectSearchProductReview", keyword, limit],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/search/products-for-review?keyword=${keyword}&adult_yn=${
          adult_yn || "N"
        }${limit ? `&limit=${limit}` : ""}`
      );

      return response.data;
    },
    enabled: !!keyword,
    placeholderData: (previousData) => previousData,
  });
};

export const useSelectWeeklyMostSearched = (
  adult_yn?: string,
  limit?: number
) => {
  return useQuery<IUseSelectWeeklyMostSearchedResponse, unknown>({
    queryKey: [
      "selectWeeklyMostSearched",
      adult_yn || "N",
      limit || 6,
    ],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/search/weekly-most-searched?adult_yn=${
          adult_yn || "N"
        }&limit=${limit || 6}`
      );

      return response.data;
    },
  });
};

export const useSelectProductSuggestByRecentViewed = (
  recent_viewed_product_id: string | number
) => {
  return useQuery<IUseSelectProductSuggestByRecentViewedResponse, unknown>({
    queryKey: ["selectProductSuggestByRecentViewed", recent_viewed_product_id],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/suggest-by-recent-viewed/${recent_viewed_product_id}`
      );

      return response.data;
    },
    enabled: !!recent_viewed_product_id && recent_viewed_product_id !== 0,
  });
};

export const useSelectTrendingKeywords = () => {
  return useQuery<IUseSelectTrendingKeywordsResponse, unknown>({
    queryKey: ["selectTrendingKeywords"],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/search/trending-keywords`);
      return response;
    },
  });
};
