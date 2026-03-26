import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
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
  });
};
