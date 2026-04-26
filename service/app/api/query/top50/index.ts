import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import {
  PUBLIC_PRODUCT_GC_TIME_MS,
  PUBLIC_PRODUCT_STALE_TIME_MS,
} from "../product";
import { IUseSelectProductsResponse } from "../product/dto";

export type TTop50Area =
  | "freeSerialTop"
  | "paidSerialTop"
  | "paidEndTop"
  | "paidStandaloneTop";

export const useSelectTop50Products = (
  productAreaType: TTop50Area = "freeSerialTop"
) => {
  return useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectTop50Products", productAreaType],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/managed?division=main&area=${productAreaType}&limit=50`
      );
      return response.data;
    },
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
  });
};
