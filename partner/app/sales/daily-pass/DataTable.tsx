"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { IDailyTicket } from "@/types/daily-ticket";
import { format } from "date-fns";

interface Props {
  data: IDailyTicket[];
  loading?: boolean;
}

export default function DailyTicketsTable({ data, loading }: Props) {
  const columns: Column[] = [
    {
      header: "Date",
      key: "created_date",
      render: (_, row: IDailyTicket) => {
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
      header: "계약 유형",
      key: "contract_type",
    },
    {
      header: "사업자",
      key: "cp_company_name",
    },
    {
      header: "콘텐츠 유형",
      key: "publish_regular_yn",
      render: (_, row: IDailyTicket) => {
        return row.publish_regular_yn === "Y" ? "연재" : "단행본";
      },
    },
    {
      header: "판매 시작일",
      key: "paid_open_date",
      render: (_, row: IDailyTicket) => {
        return row.paid_open_date
          ? format(new Date(row.paid_open_date), "yyyy.MM.dd")
          : "-";
      },
    },
    {
      header: "ISBN",
      key: "isbn",
    },
    {
      header: "UCI",
      key: "uci",
    },
    {
      header: "회차",
      key: "episode_no",
    },
    {
      header: "이용권 내역",
      key: "item_name",
    },
    {
      header: "건수",
      key: "count_ticket_usage",
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}
