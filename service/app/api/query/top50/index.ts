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

export interface ITop50RankHistoryCell {
  basisAt: string;
  productId: number;
  title: string;
  authorNickname: string | null;
  previousRank: number | null;
  countHit: number;
  recent24hCountHit: number;
}

export interface ITop50RankHistoryBasisTime {
  basisAt: string;
  label: string;
}

export interface ITop50RankHistoryRow {
  rankNo: number;
  cells: Array<ITop50RankHistoryCell | null>;
}

export interface ITop50RankHistoryResponse {
  data: {
    areaCode: TTop50Area;
    date: string;
    limit: number;
    basisTimes: ITop50RankHistoryBasisTime[];
    rows: ITop50RankHistoryRow[];
  };
}

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

export const useSelectTop50RankHistory = ({
  productAreaType,
  date,
  enabled,
}: {
  productAreaType: TTop50Area;
  date: string;
  enabled: boolean;
}) => {
  return useQuery<ITop50RankHistoryResponse, unknown>({
    queryKey: ["selectTop50RankHistory", productAreaType, date],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/rank-history?areaCode=${productAreaType}&date=${date}&limit=50`
      );
      return response.data;
    },
    enabled,
    staleTime: PUBLIC_PRODUCT_STALE_TIME_MS,
    gcTime: PUBLIC_PRODUCT_GC_TIME_MS,
  });
};
