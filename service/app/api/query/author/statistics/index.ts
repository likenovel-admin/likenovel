import { instance } from "@/app/api/axios";
import { useQuery } from "@tanstack/react-query";
import {
  IAuthorProductDetailFunnelParams,
  IAuthorProductDetailFunnelResponse,
  IAuthorProductEpisodeDropoffParams,
  IAuthorProductEpisodeDropoffResponse,
} from "./dto";

export const useProductDetailFunnelStatistics = ({
  productId,
  startDate,
  endDate,
  page = 1,
  countPerPage = 100,
  enabled = true,
}: IAuthorProductDetailFunnelParams) => {
  return useQuery<IAuthorProductDetailFunnelResponse>({
    queryKey: [
      "productDetailFunnelStatistics",
      productId ?? null,
      startDate,
      endDate,
      page,
      countPerPage,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("search_start_date", startDate);
      params.set("search_end_date", endDate);
      params.set("page", String(page));
      params.set("count_per_page", String(countPerPage));

      if (typeof productId === "number") {
        params.set("product_id", String(productId));
      }

      const response = await instance.get(
        `/v1/query/partners/product-detail-funnel-statistics?${params.toString()}`
      );

      return response.data;
    },
    enabled: enabled && !!startDate && !!endDate,
  });
};

export const useProductEpisodeDropoffStatistics = ({
  productId,
  startDate,
  endDate,
  page = 1,
  countPerPage = 1000,
  enabled = true,
}: IAuthorProductEpisodeDropoffParams) => {
  return useQuery<IAuthorProductEpisodeDropoffResponse>({
    queryKey: [
      "productEpisodeDropoffStatistics",
      productId ?? null,
      startDate,
      endDate,
      page,
      countPerPage,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("search_start_date", startDate);
      params.set("search_end_date", endDate);
      params.set("page", String(page));
      params.set("count_per_page", String(countPerPage));

      if (typeof productId === "number") {
        params.set("product_id", String(productId));
      }

      const response = await instance.get(
        `/v1/query/partners/product-episode-dropoff-statistics?${params.toString()}`
      );

      return response.data;
    },
    enabled: enabled && !!startDate && !!endDate && typeof productId === "number",
  });
};
