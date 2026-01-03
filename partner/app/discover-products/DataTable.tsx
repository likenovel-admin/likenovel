"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { IProductDiscoveryStatistics } from "@/types/product-discovery-statistics";
import { format } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  data: IProductDiscoveryStatistics[];
  loading?: boolean;
}

export default function DiscoverProductsTable({ data, loading }: Props) {
  const route = useRouter();
  const handleClickProduct = (id?: string) => {
    route.push(`/discover-products/chart?productId=${id || ""}`);
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
      header: "연독률",
      key: "reading_rate",
      render: (_, row: IProductDiscoveryStatistics) => `${row.reading_rate}%`,
    },
    {
      header: "주요",
      key: "score1",
      render: (_, row: IProductDiscoveryStatistics) => row.score1.toString(),
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
      header: "등록일 ",
      key: "updated_date",
      render: (_, row: IProductDiscoveryStatistics) =>
        row.updated_date
          ? format(new Date(row.updated_date), "yyyy.MM.dd")
          : "-",
    },
  ];
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
