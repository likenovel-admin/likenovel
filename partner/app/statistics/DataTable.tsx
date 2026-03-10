"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { IProductStatistic } from "@/types/product-statistics";
import { format } from "date-fns";

interface Props {
  data: IProductStatistic[];
  loading?: boolean;
}

export default function StatisticsTable({ data, loading }: Props) {
  const columns: Column[] = [
    {
      header: "Date",
      key: "created_date",
      render: (_, row: IProductStatistic) => {
        return row.created_date
          ? format(new Date(row.created_date), "yyyy.MM.dd")
          : "-";
      },
    },
    {
      header: "작품명",
      key: "title",
    },
    {
      header: "작품 ID",
      key: "product_id",
    },
    {
      header: "작가명",
      key: "author_nickname",
    },
    {
      header: "작가 ID",
      key: "author_id",
    },
    {
      header: "회차수",
      key: "count_episode",
    },
    {
      header: "유료 여부",
      key: "paid_yn",
      render: (_, row: IProductStatistic) => {
        return row.paid_yn === "Y" ? "CP유료" : "-";
      },
    },
    {
      header: "담당CP",
      key: "cp_company_name",
    },
    {
      header: "조회수",
      key: "count_hit",
    },
    {
      header: "선호작 수",
      key: "count_bookmark",
    },
    {
      header: "선호 해제 수",
      key: "count_unbookmark",
    },
    {
      header: "추천수",
      key: "count_recommend",
    },
    {
      header: "평가자 수",
      key: "count_evaluation",
    },
    {
      header: "총 수익",
      key: "sum_total_sales_price",
    },
    {
      header: "조회수당 수익",
      key: "sales_price_per_count_hit",
    },
    {
      header: "CP 조회수",
      key: "count_cp_hit",
    },
    {
      header: "연독률(%)",
      key: "reading_rate",
      render: (value: number) => value ? `${value}` : '-',
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}
