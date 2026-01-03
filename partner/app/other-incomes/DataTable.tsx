"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { incomeSettlementItemType } from "@/constants/income-settlement";
import { IIncomeRecode } from "@/types/income-recodes";
import { format } from "date-fns";

interface Props {
  data: IIncomeRecode[];
  loading?: boolean;
}

export default function OtherInComesTable({ data, loading }: Props) {
  const columns: Column[] = [
    {
      header: "Date",
      key: "created_date",
      render: (_, row: IIncomeRecode) => {
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
      header: "수익 내역",
      key: "item_type",
      render: (_, row: IIncomeRecode) =>
        row.item_type ? incomeSettlementItemType[row.item_type] : "",
    },
    {
      header: "금액",
      key: "sum_income_price",
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}
