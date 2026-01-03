"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { IProductEpisodeStatistic } from "@/types/product-episode-statistics";
import { format } from "date-fns";

interface Props {
  data: IProductEpisodeStatistic[];
  loading?: boolean;
}

export default function ProductEpisodeStatisticsTable({
  data,
  loading,
}: Props) {
  const columns: Column[] = [
    {
      header: "Date",
      key: "created_date",
      render: (_, row: IProductEpisodeStatistic) => {
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
      header: "회차",
      key: "episode_no",
    },
    {
      header: "회차명",
      key: "episode_title",
    },
    {
      header: "유료여부",
      key: "paid_yn",
      render: (_, row: IProductEpisodeStatistic) => {
        return row.paid_yn === "Y" ? "유료" : "무료";
      },
    },
    {
      header: "담당 CP",
      key: "cp_company_name",
    },
    {
      header: "조회수",
      key: "count_hit",
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
      header: "24시간 이내 조회수",
      key: "count_hit_in_24h",
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}
