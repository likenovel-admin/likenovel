"use client";

import CommonTable, {
  Column,
  CommonTable2Header,
  HeaderCell,
} from "@/components/common/CommonTable";
import { Button } from "@/components/ui/button";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { ISaleByEpisode } from "@/types/sales-by-episode";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Props {
  data: ISaleByEpisode[];
  loading?: boolean;
}

export default function SaleByEpisodesTable({ data, loading }: Props) {
  const router = useRouter();

  const headerRows: HeaderCell[][] = [
    [
      {
        header: "Date",
        key: "product_id",
        rowspan: 2,
      },
      {
        header: "작품명",
        key: "title",
        rowspan: 2,
      },
      {
        header: "작품 ID",
        key: "author_nickname",
        rowspan: 2,
      },
      {
        header: "작가명",
        key: "count_episode",
        rowspan: 2,
      },
      {
        header: "회차",
        key: "contract_type",
        rowspan: 2,
      },
      {
        header: "회차명",
        key: "episode_title",
        rowspan: 2,
      },
      {
        header: "계약 유형",
        key: "created_date",
        rowspan: 2,
      },
      {
        header: "사업자",
        key: "paid_open_date",
        rowspan: 2,
      },
      {
        header: "판매시작일",
        rowspan: 2,
        key: "isbn",
      },
      {
        header: "총 판매",
        key: "uci",
        colspan: 2,
      },
      {
        header: "일반 판매",
        key: "status_code",
        colspan: 2,
      },
      {
        header: "할인 판매",
        key: "ratings_code",
        colspan: 2,
      },
      {
        header: "구입 대여권",
        key: "primary_genre",
        colspan: 2,
      },
      {
        header: "무상 대여권",
        key: "sub_genre",
        colspan: 2,
      },
      {
        header: "무료 대여권",
        key: "paid_yn",
        colspan: 2,
      },
      {
        header: "구매 취소",
        key: "monopoly_yn",
        colspan: 2,
      },
    ],
    [
      {
        header: "건수",
        key: "product_id",
      },
      {
        header: "총액",
        key: "title",
      },
      {
        header: "건수",
        key: "author_nickname",
      },
      {
        header: "총액",
        key: "count_episode",
      },
      {
        header: "건수",
        key: "contract_type",
      },
      {
        header: "총액",
        key: "cp_company_name",
      },
      {
        header: "건수",
        key: "created_date",
      },
      {
        header: "총액",
        key: "paid_open_date",
      },
      {
        header: "건수",
        key: "isbn",
      },
      {
        header: "총액",
        key: "uci",
      },
      {
        header: "건수",
        key: "status_code",
      },
      {
        header: "총액",
        key: "ratings_code",
      },
      {
        header: "건수",
        key: "primary_genre",
      },
      {
        header: "총액",
        key: "sub_genre",
      },
    ],
  ];

  const columns: Column[] = [
    {
      header: "Date",
      key: "created_date",
      render: (_, row: ISaleByEpisode) =>
        format(new Date(row.created_date), "yyyy.MM.dd"),
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
      header: "회차",
      key: "episode_no", //
    },
    {
      header: "회차명",
      key: "episode_title",
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
      header: "판매시작일",
      key: "paid_open_date",
      render: (_, row: ISaleByEpisode) =>
        row.paid_open_date
          ? format(new Date(row.paid_open_date), "yyyy.MM.dd")
          : "-",
    },

    // 총합
    {
      header: "건수",
      key: "count_total_sales",
    },
    {
      header: "총액",
      key: "sum_total_sales_price",
    },

    // 일반 판매
    {
      header: "건수",
      key: "count_normal_sales",
    },
    {
      header: "총액",
      key: "sum_normal_price",
    },

    // 할인 판매
    {
      header: "건수",
      key: "count_discount_sales",
    },
    {
      header: "총액",
      key: "sum_discount_price",
    },

    // 유료 티켓
    {
      header: "건수",
      key: "count_paid_ticket_sales",
    },
    {
      header: "총액",
      key: "sum_paid_ticket_price",
    },

    // 증정 티켓
    {
      header: "건수",
      key: "count_comped_ticket_sales",
    },
    {
      header: "총액",
      key: "sum_comped_ticket_price",
    },

    // 무료 티켓
    {
      header: "건수",
      key: "count_free_ticket_sales",
    },
    {
      header: "총액",
      key: "sum_free_ticket_price",
    },

    // 구매 취소
    {
      header: "건수",
      key: "count_total_refund",
    },
    {
      header: "총액",
      key: "sum_total_refund_price",
    },
  ];

  return (
    <>
      <CommonTable2Header
        headerRows={headerRows}
        columns={columns}
        data={data}
        loading={loading}
      />
    </>
  );
}
