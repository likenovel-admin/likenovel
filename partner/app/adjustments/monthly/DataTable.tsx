"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { MonthlySettlementItemType } from "@/constants/monthly-settlement";
import { IMonthlySettlement } from "@/types/monthly-settlement";
import { format } from "date-fns";

interface Props {
  data: IMonthlySettlement[];
  loading?: boolean;
}

export default function AdminMonthlySettlementTable({ data, loading }: Props) {
  const columns: Column[] = [
    {
      header: "작가/CP명",
      key: "created_date_1",
      render: (_, row: IMonthlySettlement) => row.author_name || row.cp_name,
    },
    {
      header: "Date",
      key: "created_date",
      render: (_, row: IMonthlySettlement) => {
        return row.created_date
          ? format(new Date(row.created_date), "yyyy.MM")
          : "-";
      },
    },
    {
      header: "매출 구분",
      key: "item_type",
      render: (_, row: IMonthlySettlement) =>
        row.item_type ? MonthlySettlementItemType[row.item_type] : "",
    },
    {
      header: "결제 OS",
      key: "device_type",
    },
    {
      header: "매출액",
      key: "sum_total_sales_price",
    },
    {
      header: "결제 수수료",
      key: "fee",
    },
    {
      header: "순 매출액",
      key: "net_sales_price",
    },
    {
      header: "공급가액",
      key: "taxable_price",
    },
    {
      header: "부가세액",
      key: "vat_price",
    },
    {
      header: "정산액",
      key: "settlement_price",
    },
    {
      header: "플랫폼 수익",
      key: "platform_revenue",
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}

export function AuthorCPMonthlySettlementTable({ data, loading }: Props) {
  const columns: Column[] = [
    {
      header: "Date",
      key: "created_date_1",
      render: (_, row: IMonthlySettlement) => {
        return row.created_date
          ? format(new Date(row.created_date), "yyyy.MM")
          : "-";
      },
    },
    {
      header: "매출 구분",
      key: "item_type",
      render: (_, row: IMonthlySettlement) =>
        row.item_type ? MonthlySettlementItemType[row.item_type] : "",
    },
    {
      header: "결제 OS",
      key: "device_type",
    },
    {
      header: "매출액",
      key: "sum_total_sales_price",
    },
    {
      header: "결제 수수료",
      key: "fee",
    },
    {
      header: "순 매출액",
      key: "net_sales_price",
    },
    {
      header: "공급가액",
      key: "taxable_price",
    },
    {
      header: "부가세액",
      key: "vat_price",
    },
    {
      header: "정산액",
      key: "settlement_price",
    },
    {
      header: "플랫폼 수익",
      key: "platform_revenue",
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}
