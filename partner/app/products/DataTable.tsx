"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { Button } from "@/components/ui/button";
import { productRatingsCode, productStatusCode } from "@/constants/product";
import { IProduct } from "@/types/product";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface Props {
  data: IProduct[];
  loading?: boolean;
}

export default function WorksTable({ data, loading }: Props) {
  const router = useRouter();
  const [brokenImageMap, setBrokenImageMap] = useState<Record<number, boolean>>({});

  const cdnBaseUrl = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_HOST_CDN_URL?.trim();
    if (!raw) return "https://cdn.likenovel.net";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    return `https://${raw}`;
  }, []);

  const goToProductView = (productId: string) => {
    router.push(`/products/upload?mode=view&id=${productId}`);
  };

  const goToProductEdit = (productId: string) => {
    router.push(`/products/upload?mode=edit&id=${productId}`);
  };

  const resolveCoverSrc = (row: IProduct) => {
    const path =
      row.cover_image_path ||
      row.coverImagePath ||
      row.thumbnail_file_path ||
      row.thumbnailFilePath;

    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith("//")) return `https:${path}`;
    if (path.startsWith("/")) return `${cdnBaseUrl}${path}`;
    return `${cdnBaseUrl}/${path}`;
  };

  const columns: Column[] = [
    {
      header: "작품ID",
      key: "product_id",
    },
    {
      header: "표지",
      key: "cover_image_path",
      render: (_, row: IProduct) => {
        const src = resolveCoverSrc(row);
        const isBroken = brokenImageMap[row.product_id] === true;

        return (
          <button
            type="button"
            onClick={() => goToProductView(String(row.product_id))}
            className="inline-flex"
            aria-label={`${row.title} 작품 상세로 이동`}
          >
            {src && !isBroken ? (
              <img
                src={src}
                alt={row.title}
                className="h-[42px] w-[28px] rounded object-cover"
                onError={() =>
                  setBrokenImageMap((prev) => ({
                    ...prev,
                    [row.product_id]: true,
                  }))
                }
              />
            ) : (
              <div className="h-[42px] w-[28px] rounded bg-[#EEF1F6]" />
            )}
          </button>
        );
      },
    },
    {
      header: "작품명",
      key: "title",
      render: (_, row: IProduct) => (
        <button
          type="button"
          onClick={() => goToProductView(String(row.product_id))}
          className="text-left text-[#1F2124] underline-offset-2 hover:underline"
        >
          {row.title}
        </button>
      ),
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
      header: "유형",
      key: "price_type",
      render: (_, row: IProduct) => (row.price_type === "paid" ? "유료" : "무료"),
    },
    {
      header: "해당CP",
      key: "cp_company_name",
    },
    {
      header: "작품 등록일",
      key: "created_date",
      render: (_, row: IProduct) => {
        return row.created_date ? format(new Date(row.created_date), "yyyy.MM.dd") : "-";
      },
    },
    {
      header: "유료 전환일",
      key: "paid_open_date",
      render: (_, row: IProduct) => {
        return row.paid_open_date ? format(new Date(row.paid_open_date), "yyyy.MM.dd") : "-";
      },
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
      header: "독점 여부",
      key: "monopoly_yn",
      render: (_, row: IProduct) => (row.monopoly_yn === "Y" ? "독점" : "비독점"),
    },
    {
      header: "관리",
      key: "actions",
      render: (_, row: IProduct) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => goToProductEdit(String(row.product_id))}>
            관리
          </Button>
        </div>
      ),
    },
  ];

  return <CommonTable columns={columns} data={data} loading={loading} />;
}
