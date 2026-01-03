import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import { IUseSelectSuggestProductsResponse } from "./dto";

export const useSelectSuggestProducts = (
  productId: number,
  nearby: "content" | "genre" | "bookmark" | "cart"
) => {
  return useQuery<IUseSelectSuggestProductsResponse, unknown>({
    queryKey: ["selectSuggestProducts", productId, nearby],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/suggest/${productId}?nearby=${nearby}`
      );
      return response.data;
    },
    enabled: !!productId,
  });
};
