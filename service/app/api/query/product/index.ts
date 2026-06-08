import { InfiniteData, queryOptions, useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import { IUseSelectPanelsResponse } from "../banner/dto";
import {
  IEpisodeListResponse,
  IGetAvailableTicketsResponse,
  IGetDirectRecommendResponse,
  IGetEpisodeProductParams,
  IGetHomeTickerResponse,
  IGetMainSingleSlotsResponse,
  IGetRecentProductResponse,
  IPublisherPromotionProductsResponse,
  ISuggestByRecentViewedResponse,
  IUseSelectMainRuleSlotsResponse,
  IUseSelect69PassProductsResponse,
  IUseSelectProductDetailResponse,
  IUseSelectProductsResponse,
  IUseSelectSuggestMainProductsResponse,
  IUseSelectWaitForFreeProductsResponse,
} from "./dto";

export const PUBLIC_PRODUCT_STALE_TIME_MS = 5 * 60 * 1000;
export const PUBLIC_PRODUCT_GC_TIME_MS = 30 * 60 * 1000;
const HOME_TICKER_STALE_TIME_MS = 60 * 1000;

export const useSelectProducts = (
  adult_yn?: string,
  cacheIdentity: string = "guest",
  enabled: boolean = true
): any => {
  /**
   * 메인 TOP 구좌에서 노출 가능한 최대치(모바일 40개 요구사항)를 만족하기 위해
   * API 호출 limit을 40으로 고정합니다.
   *
   * - FreeTop: 모바일 최대 40개, PC 최대 30개(렌더링에서 slice)
   * - PaidTop도 동일 limit로 더 많이 받아오지만, UI는 자체 로직으로 노출량이 제한됨
   */
  const limit = 40;
  const adultYnParam = adult_yn || "N";

  const banners = useQuery<IUseSelectPanelsResponse, unknown>({
    queryKey: ["selectBanners"],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/banners/main`);
      return response.data;
    },
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
    enabled,
  });

  const freeTopsProducts = useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectFreeSerialTopProducts", adultYnParam, cacheIdentity],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/managed?division=main&area=freeSerialTop&limit=${limit}&adult_yn=${adultYnParam}`
      );
      return response.data;
    },
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
    enabled,
  });

  const publisherPromotionProducts = useQuery<
    IPublisherPromotionProductsResponse,
    unknown
  >({
    queryKey: ["selectPublisherPromotionProducts", adultYnParam, cacheIdentity],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/publisher-promotion?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
    enabled,
  });

  const paidTopsProducts = useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectPaidMainTopProducts", adultYnParam, cacheIdentity],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/managed?division=main&area=paidMainTop&limit=${limit}&adult_yn=${adultYnParam}`
      );
      return response.data;
    },
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
    enabled,
  });

  return {
    data: {
      publisherPromotionProducts: publisherPromotionProducts.data?.data ?? [],
      publisherPromotionTitle:
        publisherPromotionProducts.data?.title ?? "출판사 프로모션",
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
      publisherPromotionTitle:
        publisherPromotionProducts.data?.title ?? "출판사 프로모션",
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
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
  });
};

export const useSelectMainSuggestProducts = (
  adult_yn?: string,
  cacheIdentity: string = "guest",
  enabled: boolean = true
) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IUseSelectSuggestMainProductsResponse, unknown>({
    queryKey: ["selectMainSuggestProducts", adultYnParam, cacheIdentity],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/suggest-managed?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
    enabled,
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

export const useGetProductsAdminGift = (enabled: boolean) => {
  return useQuery<IUseSelectWaitForFreeProductsResponse, unknown>({
    queryKey: ["getProductsAdminGift"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/products/admin-gift");
      return response.data;
    },
    enabled,
  });
};

export const useSelectLatestUpdateProducts = (
  adult_yn?: string,
  cacheIdentity: string = "guest",
  enabled: boolean = true
) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectLatestUpdateProducts", adultYnParam, cacheIdentity],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/latest-update?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
    enabled,
  });
};

export const useSelectMainRuleSlots = (
  adult_yn?: string,
  cacheIdentity: string = "guest",
  enabled: boolean = true
) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IUseSelectMainRuleSlotsResponse, unknown>({
    queryKey: ["selectMainRuleSlots", adultYnParam, cacheIdentity],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/main-rule-slots?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
    enabled,
  });
};

export const useSelectInterestDropSoonUpdateProducts = (
  adult_yn?: string,
  enabled: boolean = true,
  cacheIdentity: string = "guest"
) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: [
      "selectInterestDropSoonUpdateProducts",
      adultYnParam,
      cacheIdentity,
    ],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/interest-drop-products-soon?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
    enabled,
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
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
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
  });

export const useSelectFreeAllProductsInfinite = (
  productType: "normal" | "free",
  genres?: string[],
  limit?: number,
  adult_yn?: string
) => {
  /**
   * 무료연재(전체) 페이지에서 27개(page=1)만 보이는 문제를 해결하기 위해,
   * 동일 API(`/v1/query/products/all`)를 useInfiniteQuery로 페이지네이션하여 누적 로딩합니다.
   *
   * - 서버 응답에 pagination 메타가 없어서, `마지막 페이지의 data 길이 < limit`이면 종료로 판단합니다.
   * - 디자인은 그대로 두고, ProductArea에서 IntersectionObserver로 fetchNextPage만 트리거합니다.
   */
  const itemsPerPage = limit ? limit : 27;
  const adultYnParam = adult_yn || "N";

  // NOTE: TanStack Query(v5)에서 pageParam 기본 타입은 unknown이므로,
  // pageParam 타입을 number로 명시해 빌드 타입 에러를 방지합니다.
  return useInfiniteQuery<
    IUseSelectProductsResponse,
    unknown,
    InfiniteData<IUseSelectProductsResponse, number>,
    readonly unknown[],
    number
  >({
    queryKey: [
      "selectFreeAllProductsInfinite",
      productType,
      genres,
      itemsPerPage,
      adultYnParam,
    ],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const genresQueryString =
        genres && genres.length > 0
          ? genres.map((genre) => `genres=${genre}`).join("&")
          : "";

      const baseUrl = `/v1/query/products/all?price_type=free&product_type=${productType}&page=${pageParam}&limit=${itemsPerPage}${
        adultYnParam ? `&adult_yn=${adultYnParam}` : ""
      }`;
      const finalUrl = genresQueryString
        ? `${baseUrl}&${genresQueryString}`
        : baseUrl;

      const response = await instance.get(finalUrl);
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const lastCount = lastPage?.data?.length ?? 0;
      if (lastCount < itemsPerPage) return undefined;
      return allPages.length + 1;
    },
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
  });
};

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
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
  });

export const useSelectPaidAllProductsInfinite = (
  stateType: "ongoing" | "end" | "standalone",
  genres?: string[],
  limit?: number,
  adult_yn?: string
) => {
  /**
   * 유료 페이지에서 1페이지(기본 27개)만 보이는 문제를 해결하기 위해,
   * 동일 API(`/v1/query/products/all`)를 useInfiniteQuery로 페이지네이션하여 누적 로딩합니다.
   *
   * - 서버 응답에 pagination 메타가 없어서, `마지막 페이지의 data 길이 < limit`이면 종료로 판단합니다.
   * - UI 변경 없이, 화면(ProductArea)에서 IntersectionObserver로 fetchNextPage만 트리거합니다.
   */
  const itemsPerPage = limit ? limit : 27;
  const adultYnParam = adult_yn || "N";

  return useInfiniteQuery<
    IUseSelectProductsResponse,
    unknown,
    InfiniteData<IUseSelectProductsResponse, number>,
    readonly unknown[],
    number
  >({
    queryKey: [
      "selectPaidAllProductsInfinite",
      stateType,
      genres,
      itemsPerPage,
      adultYnParam,
    ],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const genresQueryString =
        genres && genres.length > 0
          ? genres.map((genre) => `genres=${genre}`).join("&")
          : "";

      const baseUrl = `/v1/query/products/all?price_type=paid&product_state=${stateType}&page=${pageParam}&limit=${itemsPerPage}${
        adultYnParam ? `&adult_yn=${adultYnParam}` : ""
      }`;
      const finalUrl = genresQueryString
        ? `${baseUrl}&${genresQueryString}`
        : baseUrl;

      const response = await instance.get(finalUrl);
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const lastCount = lastPage?.data?.length ?? 0;
      if (lastCount < itemsPerPage) return undefined;
      return allPages.length + 1;
    },
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
  });
};

export const useSelectInterestDropProducts = (
  enabled: boolean = true,
  cacheIdentity: string = "guest"
) => {
  return useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectInterestDropSoonProducts", cacheIdentity],
    queryFn: async () => {
      const response = await instance.get(
        "/v1/query/products/interest-drop-products"
      );
      return response.data;
    },
    enabled,
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
  });
};

export const getEpisodeListQueryOptions = (
  params: IGetEpisodeProductParams,
  enabled: boolean = true
) =>
  queryOptions<IEpisodeListResponse>({
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
    enabled: enabled && !!params.product_id,
  });

export const useGetEpisodeList = (
  params: IGetEpisodeProductParams,
  enabled: boolean = true
) => {
  return useQuery(getEpisodeListQueryOptions(params, enabled));
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
  enabled = true,
}: {
  episode_id?: number;
  product_id?: number;
  enabled?: boolean;
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
    enabled: !!product_id && enabled,
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
  enabled?: boolean,
  cacheIdentity: string = "guest"
) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IGetRecentProductResponse>({
    queryKey: ["getRecentProduct", limit, adultYnParam, cacheIdentity],
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

export const useGetDirectRecommend = (
  adult_yn?: string,
  enabled: boolean = true,
  cacheIdentity: string = "guest"
) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IGetDirectRecommendResponse>({
    queryKey: ["getDirectRecommend", adultYnParam, cacheIdentity],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/direct-recommend?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
    enabled,
  });
};

export const useGetHomeTicker = (
  adult_yn?: string,
  enabled: boolean = true,
  cacheIdentity: string = "guest"
) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IGetHomeTickerResponse>({
    queryKey: ["getHomeTicker", adultYnParam, cacheIdentity],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/home-ticker?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
    staleTime: HOME_TICKER_STALE_TIME_MS,
    refetchInterval: HOME_TICKER_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
    enabled,
  });
};

export const useGetMainSingleSlots = (
  adult_yn?: string,
  enabled: boolean = true,
  cacheIdentity: string = "guest"
) => {
  const adultYnParam = adult_yn || "N";
  return useQuery<IGetMainSingleSlotsResponse>({
    queryKey: ["getMainSingleSlots", adultYnParam, cacheIdentity],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/main-single-slots?adult_yn=${adultYnParam}`
      );
      return response.data;
    },
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
    enabled,
  });
};
