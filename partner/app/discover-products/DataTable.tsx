"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { Button } from "@/components/ui/button";
import { IProductDiscoveryStatistics } from "@/types/product-discovery-statistics";
import { format } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  data: IProductDiscoveryStatistics[];
  loading?: boolean;
  hideEvaluationColumn?: boolean;
  summaryMode?: boolean;
}

const userSiteUrl = process.env.NEXT_PUBLIC_USER_SITE_URL || "";

export default function DiscoverProductsTable({
  data,
  loading,
  hideEvaluationColumn = false,
  summaryMode = false,
}: Props) {
  const route = useRouter();
  const handleClickProduct = (id?: string) => {
    const modeQuery = summaryMode ? "&mode=summary" : "";
    route.push(`/discover-products/chart?productId=${id || ""}${modeQuery}`);
  };
  const columns: Column[] = [
    {
      header: "작품명",
      key: "title",
      render: (_, row: IProductDiscoveryStatistics) => (
        <div className="flex gap-2 items-center">
          {row.cover_image_path && (
            <Image
              className="dark:invert"
              src={row.cover_image_path}
              alt="cover_image_path"
              width={"43"}
              height={"64"}
              priority
            />
          )}
          {row.title}
        </div>
      ),
    },
    {
      header: "작가명",
      key: "author_nickname",
    },
    {
      header: "장르",
      key: "primary_genre",
    },
    {
      header: "회차수",
      key: "count_episode",
    },
    {
      header: "조회수",
      key: "count_hit",
    },
    {
      header: "선호작수",
      key: "count_bookmark",
    },
    {
      header: "연독률",
      key: "reading_rate",
      render: (_, row: IProductDiscoveryStatistics) => row.reading_rate ? `${row.reading_rate}%` : '-',
    },
    {
      header: "독자수",
      key: "count_read_user",
    },
    {
      header: "등록일",
      key: "created_date",
      render: (_, row: IProductDiscoveryStatistics) =>
        row.created_date
          ? format(new Date(row.created_date), "yyyy.MM.dd")
          : "-",
    },
    {
      header: "주요타겟",
      key: "primary_reader_group1",
    },
    {
      header: "최근 업로드일",
      key: "updated_date",
      render: (_, row: IProductDiscoveryStatistics) =>
        row.updated_date
          ? format(new Date(row.updated_date), "yyyy.MM.dd")
          : "-",
    },
    {
      header: "",
      key: "product_link",
      render: (_, row: IProductDiscoveryStatistics) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            window.open(`${userSiteUrl}/product/${row.product_id}`, "_blank");
          }}
        >
          바로가기
        </Button>
      ),
    },
  ];

  if (!hideEvaluationColumn) {
    columns.splice(7, 0, {
      header: "작품평가",
      key: "score1",
      render: (_, row: IProductDiscoveryStatistics) => row.score1.toString(),
    });
  }

  return (
    <>
      <CommonTable
        columns={columns}
        data={data}
        loading={loading}
        rowClick={handleClickProduct}
      />
    </>
  );
}
