"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { IProductContractOfferDeduction } from "@/types/product-contract-offer-deduction";
import { format } from "date-fns";

interface Props {
  data: IProductContractOfferDeduction[];
  loading?: boolean;
}

export default function DeductionDepositTable({ data, loading }: Props) {
  const columns: Column[] = [
    {
      header: "Date",
      key: "created_date",
      render: (_, row: IProductContractOfferDeduction) => {
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
      header: "작품ID",
      key: "product_id",
    },
    {
      header: "작가명",
      key: "author_nickname",
    },
    {
      header: "계약 id",
      key: "offer_id",
    },
    {
      header: "계약 유형",
      key: "contract_type",
    },
    {
      header: "담당CP",
      key: "cp_company_name",
    },
    {
      header: "발행계약금",
      key: "offer_amount",
    },
    {
      header: "당월 계약금 잔액",
      key: "current_offer_amount",
    },
    {
      header: "정산액",
      key: "settlement_price",
    },
    {
      header: "정산 후 잔액",
      key: "privious_offer_amount",
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}
