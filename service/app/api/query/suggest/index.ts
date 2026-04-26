import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import {
  PUBLIC_PRODUCT_GC_TIME_MS,
  PUBLIC_PRODUCT_STALE_TIME_MS,
} from "../product";
import { IUseSelectSuggestProductsResponse } from "./dto";

export const useSelectSuggestProducts = (
  productId: number,
  nearby: "content" | "genre" | "bookmark" | "cart",
  enabled: boolean = true
) => {
  return useQuery<IUseSelectSuggestProductsResponse, unknown>({
    queryKey: ["selectSuggestProducts", productId, nearby],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/suggest/${productId}?nearby=${nearby}`
      );
      return response.data;
    },
    enabled: !!productId && enabled,
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
  });
};
