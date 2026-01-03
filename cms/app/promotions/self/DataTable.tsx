"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import {
  directRecommendStatus,
  directRecommendType,
} from "@/enums/directRecommend";
import { IDirectPromotion } from "@/types/directPromotion";
import { formatDate } from "date-fns";
import { useRouter } from "next/navigation";

interface Props {
  data: IDirectPromotion[];
  loading?: boolean;
  refetch: () => void;
}

export default function DirectPromotionTable({ data, loading }: Props) {
  const route = useRouter();

  const columns: Column[] = [
    {
      header: "작품 ID",
      key: "product_id",
    },
    { header: "작품명", key: "title" },
    { header: "작가명", key: "author_name" },
    {
      header: "시작일",
      key: "date",
      render: (_, row: IDirectPromotion) =>
        row.start_date ? formatDate(row.start_date, "yyyy-MM-dd") : "",
    },
    {
      header: "프로모션 종류",
      key: "type",
      render: (_, row: IDirectPromotion) =>
        row.type ? directRecommendType[row.type] : "",
    },
    {
      header: "상태",
      key: "status",
      render: (_, row: IDirectPromotion) =>
        row.status ? directRecommendStatus[row.status] : "",
    },
    {
      header: "명당 증정 대여권 수",
      key: "num_of_ticket_per_person",
    },
  ];
  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}
