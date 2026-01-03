"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { Button } from "@/components/ui/button";
import { productRatingsCode, productStatusCode } from "@/constants/product";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { IProduct } from "@/types/product";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Props {
  data: IProduct[];
  loading?: boolean;
}

export default function WorksTable({ data, loading }: Props) {
  const router = useRouter();

  const handleEdit = (productId: string) => {
    router.push(`/products/details?id=${productId}`);
  };

  const columns: Column[] = [
    {
      header: "작품ID",
      key: "product_id",
    },
    {
      header: "작품명",
      key: "title",
    },
    {
      header: "작가명",
      key: "author_nickname",
    },
    {
      header: "회차수",
      key: "count_episode",
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
      header: "작품 등록일",
      key: "created_date",
      render: (_, row: IProduct) => {
        return row.created_date
          ? format(new Date(row.created_date), "yyyy.MM.dd")
          : "-";
      },
    },
    {
      header: "유료 전환일",
      key: "paid_open_date",
      render: (_, row: IProduct) => {
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
      header: "연재 상태",
      key: "status_code",
      render: (_, row: IProduct) => {
        return row.status_code ? productStatusCode[row.status_code] : "";
      },
    },
    {
      header: "연령등급",
      key: "ratings_code",
      render: (_, row: IProduct) => {
        return row.ratings_code ? productRatingsCode[row.ratings_code] : "";
      },
    },
    {
      header: "1차 장르",
      key: "primary_genre",
    },
    {
      header: "2차 장르",
      key: "sub_genre",
    },
    {
      header: "판매 형태",
      key: "price_type",
    },
    {
      header: "독점 여부",
      key: "monopoly_yn",
      render: (_, row: IProduct) => (row.monopoly_yn === "Y" ? "예" : "비독점"),
    },
    {
      header: "수정",
      key: "actions",
      render: (_, row: IProduct) => (
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            onClick={() => handleEdit(row.product_id + "")}
          >
            수정
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}
