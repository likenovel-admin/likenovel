"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { Button } from "@/components/ui/button";
import { IMonthlySaleByProduct } from "@/types/monthly-sales-by-product";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Props {
  data: IMonthlySaleByProduct[];
  loading?: boolean;
  isAdmin?: boolean;
  onEdit: (id: string) => void;
  onManage: (id: string) => void;
}

export default function MonthlySaleByProductsTable({
  data,
  loading,
  isAdmin,
  onEdit,
  onManage,
}: Props) {
  const router = useRouter();

  const handleEdit = (productId: string) => {
    router.push(`/products/details?id=${productId}`);
  };

  const columns: Column[] = [
    {
      header: "Date",
      key: "created_date",
      render: (_, row: IMonthlySaleByProduct) => {
        return row.created_date
          ? format(new Date(row.created_date), "yyyy.MM")
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
      header: "담당 CP",
      key: "cp_company_name",
    },
    {
      header: "판매 시작일",
      key: "paid_open_date",
      render: (_, row: IMonthlySaleByProduct) => {
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
      header: "정가",
      key: "series_regular_price",
    },
    {
      header: "판매가",
      key: "sale_price",
    },
    {
      header: "총 매출",
      key: "total_price",
    },
    {
      header: "총 정산액",
      key: "sum_settlement_price_web",
    },
    {
      header: "상세",
      key: "actions",
      render: (_, row: IMonthlySaleByProduct) => (
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={() => onEdit(row.product_id + "")}>
            확인
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => onManage(row.product_id + "")}
            >
              관리
            </Button>
          )}
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
