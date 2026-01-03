import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";
import { IUseSelectProductsResponse } from "../product/dto";

export const useSelectTop50Products = (productAreaType: string = "freeTop") => {
  return useQuery<IUseSelectProductsResponse, unknown>({
    queryKey: ["selectTop50Products"],
    queryFn: async () => {
      // const response = await instance.get(`/v1/query/products/managed?area="${productAreaType}"&limit=50`);
      const response = await instance.get(
        `/v1/query/products/managed?division=main&area=${productAreaType}`
      );
      return response.data;
    },
  });
};
