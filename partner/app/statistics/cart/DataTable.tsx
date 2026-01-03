"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { ICartAnalysis } from "@/types/cart-analysis";
import { format } from "date-fns";

interface Props {
  data: ICartAnalysis[];
  loading?: boolean;
}

export default function CartsTable({ data, loading }: Props) {
  const columns: Column[] = [
    {
      header: "작품명",
      key: "title",
    },
    {
      header: "연관작품1",
      key: "relative_1_product_title",
    },
    {
      header: "연관작품2",
      key: "relative_2_product_title",
    },
    {
      header: "연관작품3",
      key: "relative_3_product_title",
    },
    {
      header: "연관작품4",
      key: "relative_4_product_title",
    },
    {
      header: "연관작품5",
      key: "relative_5_product_title",
    },
    {
      header: "연관작품6",
      key: "relative_6_product_title",
    },
    {
      header: "연관작품7",
      key: "relative_7_product_title",
    },
    {
      header: "연관작품8",
      key: "relative_8_product_title",
    },
    {
      header: "연관작품9",
      key: "relative_9_product_title",
    },
    {
      header: "연관작품10",
      key: "relative_10_product_title",
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}
