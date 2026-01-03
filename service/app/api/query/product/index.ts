import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import { IUseSelectPanelsResponse } from "../banner/dto";
import {
  IEpisodeListResponse,
  IGetAvailableTicketsResponse,
  IGetDirectRecommendResponse,
  IGetEpisodeProductParams,
  IGetRecentProductResponse,
  IPublisherPromotionProductsResponse,
  ISuggestByRecentViewedResponse,
  IUseSelect69PassProductsResponse,
  IUseSelectProductDetailResponse,
  IUseSelectProductsResponse,
  IUseSelectSuggestMainProductsResponse,
  IUseSelectWaitForFreeProductsResponse,
} from "./dto";

export const useSelectProducts = (adult_yn?: string): any => {
  const limit = 27;
  const adultYnParam = adult_yn || "N";

  const banners = useQuery<IUseSelectPanelsResponse, unknown>({
    queryKey: ["selectBanners"],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/banners/main`);
      return response.data;
    },
  });

  const freeTopsProducts = useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectFreeTopProducts", adultYnParam],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/managed?division=main&area=freeTop&limit=${limit}&adult_yn=${adultYnParam}`
      );
      return response.data;
    },
  });

  const publisherPromotionProducts = useQuery<
    IPublisherPromotionProductsResponse,
    unknown
  >({
    queryKey: ["selectPublisherPromotionProducts", adultYnParam],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/publisher-promotion?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
  });

  const paidTopsProducts = useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectPaidTopProducts", adultYnParam],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/managed?division=main&area=paidTop&limit=${limit}&adult_yn=${adultYnParam}`
      );
      return response.data;
    },
  });

  return {
    data: {
      publisherPromotionProducts: publisherPromotionProducts.data?.data ?? [],
      banners: banners.data?.data ?? {
        primaryPanels: [],
        secondaryPanels: [],
        teriayPanels: [],
      },
      topsProducts: [
        ...(freeTopsProducts.data?.data || []),
        ...(paidTopsProducts.data?.data || []),
      ],
    },
    isSuccess: banners.isSuccess && freeTopsProducts.isSuccess,
  };
};

export const useSelectBannerPromotionPaid = (): any => {
  const banners = useQuery<IUseSelectPanelsResponse, unknown>({
    queryKey: ["selectBannerPaid"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/banners/paid");
      return response.data;
    },
  });

  const publisherPromotionProducts = useQuery<
    IPublisherPromotionProductsResponse,
    unknown
  >({
    queryKey: ["selectPublisherPromotionProducts"],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/publisher-promotion`
      );
      return response.data;
    },
  });

  return {
    data: {
      publisherPromotionProducts: publisherPromotionProducts.data?.data ?? [],
      banners: banners.data?.data ?? [],
    },
    isSuccess: banners.isSuccess && publisherPromotionProducts.isSuccess,
  };
};

export const useSelectBannerPromotion = (): any => {
  const banners = useQuery<IUseSelectPanelsResponse, unknown>({
    queryKey: ["selectBannerPromotion"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/banners/promotion");
      return response.data;
    },
  });

  return {
    data: {
      banners: banners.data?.data ?? [],
    },
    isSuccess: banners.isSuccess,
  };
};

export const useSelectProductDetail = (productId: number) => {
  return useQuery<IUseSelectProductDetailResponse, unknown>({
    queryKey: ["selectProductDetail", productId],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/${productId}/details-group`
      );
      return response.data;
    },
    enabled: !!productId,
  });
};

export const useSelectMainSuggestProducts = (adult_yn?: string) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IUseSelectSuggestMainProductsResponse, unknown>({
    queryKey: ["selectMainSuggestProducts", adultYnParam],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/suggest-managed?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
  });
};

export const useGetProductsWaitForFree = (enabled: boolean) => {
  return useQuery<IUseSelectWaitForFreeProductsResponse, unknown>({
    queryKey: ["getProductsWaitForFree"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/products/wait-for-free");
      return response.data;
    },
    enabled,
  });
};

export const useGetProducts69Pass = (enabled: boolean) => {
  return useQuery<IUseSelect69PassProductsResponse, unknown>({
    queryKey: ["getProducts69Pass"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/products/6-9-pass");
      return response.data;
    },
    enabled,
  });
};

export const useSelectLatestUpdateProducts = (adult_yn?: string) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectLatestUpdateProducts", adultYnParam],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/latest-update?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
  });
};

export const useSelectInterestDropSoonUpdateProducts = (adult_yn?: string) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectInterestDropSoonUpdateProducts", adultYnParam],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/interest-drop-products-soon?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
  });
};

export const useSelectFreeAllProducts = (
  productType: "normal" | "free",
  genres?: string[],
  page?: number,
  limit?: number,
  adult_yn?: string
) =>
  useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectFreeAllProducts", productType, genres, page, adult_yn],
    queryFn: async () => {
      const genresQueryString =
        genres && genres.length > 0
          ? genres.map((genre) => `genres=${genre}`).join("&")
          : "";

      const itemsPerPage = limit ? limit : 27;
      const baseUrl = `/v1/query/products/all?price_type=free&product_type=${productType}&page=${page}&limit=${itemsPerPage}${
        adult_yn ? `&adult_yn=${adult_yn || "N"}` : ""
      }`;
      const finalUrl = genresQueryString
        ? `${baseUrl}&${genresQueryString}`
        : baseUrl;

      const response = await instance.get(finalUrl);
      return response.data;
    },
  });

export const useSelectPaidAllProducts = (
  stateType: "ongoing" | "end",
  genres?: string[],
  page?: number,
  limit?: number,
  adult_yn?: string
) =>
  useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectPaidAllProducts", stateType, genres, page, adult_yn],
    queryFn: async () => {
      const genresQueryString =
        genres && genres.length > 0
          ? genres.map((genre) => `genres=${genre}`).join("&")
          : "";

      const itemsPerPage = limit ? limit : 27;
      const baseUrl = `/v1/query/products/all?price_type=paid&product_state=${stateType}&page=${page}&limit=${itemsPerPage}${
        adult_yn ? `&adult_yn=${adult_yn || "N"}` : ""
      }`;
      const finalUrl = genresQueryString
        ? `${baseUrl}&${genresQueryString}`
        : baseUrl;

      const response = await instance.get(finalUrl);
      return response.data;
    },
  });

export const useSelectInterestDropProducts = () => {
  return useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectInterestDropSoonProducts"],
    queryFn: async () => {
      const response = await instance.get(
        "/v1/query/products/interest-drop-products"
      );
      return response.data;
    },
  });
};

export const useGetEpisodeList = (params: IGetEpisodeProductParams) => {
  return useQuery<IEpisodeListResponse>({
    queryKey: ["getEpisodeList", JSON.stringify(params)],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.order_by) queryParams.append("order_by", params.order_by);
      if (params.order_dir) queryParams.append("order_dir", params.order_dir);

      const queryString = queryParams.toString();
      const url = `/v1/query/products/${params.product_id}/episodes${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await instance.get(url);
      return response.data;
    },
  });
};

export const useGetInfiniteEpisodeList = (params: IGetEpisodeProductParams) => {
  return useInfiniteQuery({
    queryKey: [
      "getInfiniteEpisodeList",
      params.product_id,
      params.order_by || "",
      params.order_dir || "",
    ],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const queryParams = new URLSearchParams();
      queryParams.append("page", pageParam.toString());
      queryParams.append("limit", (params.limit || 20).toString());
      if (params.order_by) queryParams.append("order_by", params.order_by);
      if (params.order_dir) queryParams.append("order_dir", params.order_dir);

      const queryString = queryParams.toString();
      const url = `/v1/query/products/${params.product_id}/episodes?${queryString}`;

      const response = await instance.get<IEpisodeListResponse>(url);
      return response.data;
    },
    getNextPageParam: (lastPage: IEpisodeListResponse) => {
      const { page, limit, totalCount } = lastPage.data.pagination;
      const hasMore = page * limit < totalCount;
      return hasMore ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};

export const useGetAvailableTickets = ({
  episode_id,
  product_id,
}: {
  episode_id?: number;
  product_id?: number;
}) => {
  return useQuery<IGetAvailableTicketsResponse>({
    queryKey: ["getEpisodeList", episode_id, product_id],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/user-productbook/available-tickets?${
          episode_id ? `episode_id=${episode_id}` : ""
        }${product_id ? `&product_id=${product_id}` : ""}`
      );
      return response.data;
    },
    enabled: !!product_id,
  });
};

// Mock hook for rental tickets (until API is ready)
export const useCheckRentalTickets = (productId: number, enabled: boolean) => {
  return useQuery({
    queryKey: ["checkRentalTickets", productId],
    queryFn: async () => {
      // Mock API call - replace with actual API when ready
      // const response = await instance.post(`/v1/command/products/${productId}/claim-rental-tickets`);

      // Simulate different scenarios based on productId
      await new Promise((resolve) => setTimeout(resolve, 300));

      const scenarios = [
        // Case 1: First-time visitor receives tickets
        {
          firstTimeVisitorTickets: 3,
          earlyReaderTickets: 0,
          waitForFreeTickets: 0,
          sixToNinePassTickets: 0,
          eventTickets: 0,
          totalReceived: 3,
        },
        // Case 2: Early reader receives tickets
        {
          firstTimeVisitorTickets: 0,
          earlyReaderTickets: 5,
          waitForFreeTickets: 0,
          sixToNinePassTickets: 0,
          eventTickets: 0,
          totalReceived: 5,
        },
        // Case 3: Multiple sources (6-9 pass + event)
        {
          firstTimeVisitorTickets: 0,
          earlyReaderTickets: 0,
          waitForFreeTickets: 2,
          sixToNinePassTickets: 3,
          eventTickets: 1,
          totalReceived: 6,
        },
        // Case 4: No tickets received
        {
          firstTimeVisitorTickets: 0,
          earlyReaderTickets: 0,
          waitForFreeTickets: 0,
          sixToNinePassTickets: 0,
          eventTickets: 0,
          totalReceived: 0,
        },
      ];

      // Use productId to determine scenario (for testing purposes)
      const scenarioIndex = productId % 4;
      return {
        data: scenarios[scenarioIndex],
      };
    },
    enabled,
    // Only run once per product visit
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const useReportProduct = () => {
  return useMutation({
    mutationFn: async ({
      product_id,
      reportType,
      content,
    }: {
      product_id: number;
      reportType: string;
      content: string;
    }) => {
      return await instance.post(`/v1/command/products/${product_id}/report`, {
        reportType,
        content,
      });
    },
  });
};

export const useInterestProduct = () => {
  return useMutation({
    mutationFn: async (product_id: number) => {
      return await instance.put(
        `/v1/command/products/${product_id}/interest/revive`
      );
    },
  });
};

export const useAddRecentProduct = () => {
  return useMutation({
    mutationFn: async (product_id: number) => {
      return await instance.post(`/v1/command/user/recent-products`, {
        product_id,
      });
    },
  });
};

export const useDeleteRecentProduct = () => {
  return useMutation({
    mutationFn: async (product_id: number) => {
      return await instance.delete(
        `/v1/command/user/recent-products/${product_id}`
      );
    },
  });
};

export const useDeleteAllRecentProduct = () => {
  return useMutation({
    mutationFn: async () => {
      return await instance.delete(`/v1/command/user/recent-products`);
    },
  });
};

export const useGetRecentProduct = (
  limit?: number,
  adult_yn?: string,
  enabled?: boolean
) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IGetRecentProductResponse>({
    queryKey: ["getRecentProduct", limit, adultYnParam],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/user/recent-products?adult_yn=${adultYnParam}${
          limit ? `&limit=${limit}}` : ""
        }`
      );
      return response.data;
    },
    enabled,
  });
};

export const useGetSuggestByRecentViewed = (adult_yn?: string) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<ISuggestByRecentViewedResponse>({
    queryKey: ["getSuggestByRecentViewed", adultYnParam],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/suggest-by-recent-viewed?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
  });
};

export const useGetDirectRecommend = (adult_yn?: string) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IGetDirectRecommendResponse>({
    queryKey: ["getDirectRecommend", adultYnParam],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/direct-recommend?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
  });
};
