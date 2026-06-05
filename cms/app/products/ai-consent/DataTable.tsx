"use client";

import { IProductAiConsentItem } from "@/api/productAiConsent/dto";
import CommonTable, { Column } from "@/components/common/CommonTable";

interface Props {
  data: IProductAiConsentItem[];
  loading?: boolean;
}

const yn = (value: "Y" | "N" | null | undefined) => (value === "Y" ? "Y" : "N");

export default function ProductAiConsentTable({ data, loading }: Props) {
  const columns: Column[] = [
    { header: "작품 ID", key: "product_id" },
    { header: "작품명", key: "title" },
    {
      header: "닉네임",
      key: "nickname",
      render: (value: string | null) => value || "-",
    },
    { header: "회차수", key: "episode_count" },
    {
      header: "작품 공개여부",
      key: "open_yn",
      render: (value: "Y" | "N") => yn(value),
    },
    {
      header: "AI홍보",
      key: "ai_promotion_yn",
      render: (value: "Y" | "N") => yn(value),
    },
    {
      header: "웹소챗",
      key: "websochat_enabled_yn",
      render: (value: "Y" | "N") => yn(value),
    },
  ];

  return (
    <CommonTable
      columns={columns}
      data={data}
      loading={loading}
      emptyMessage="데이터가 없습니다."
    />
  );
}
