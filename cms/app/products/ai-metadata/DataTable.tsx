"use client";

import { IAiProductMetadataItem } from "@/api/aiProductMetadata/dto";
import CommonTable, { Column } from "@/components/common/CommonTable";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Props {
  data: IAiProductMetadataItem[];
  loading?: boolean;
  onEdit: (productId: number) => void;
  onReanalyze: (productId: number) => void;
  onToggleExclude: (productId: number, currentValue: "Y" | "N") => void;
}

const statusLabel: Record<IAiProductMetadataItem["analysis_status"], string> = {
  missing: "미생성",
  pending: "대기",
  success: "성공",
  failed: "실패",
};

export default function AiMetadataTable({
  data,
  loading,
  onEdit,
  onReanalyze,
  onToggleExclude,
}: Props) {
  const columns: Column[] = [
    { header: "작품 ID", key: "product_id" },
    { header: "작품명", key: "title" },
    { header: "작가명", key: "author_name" },
    {
      header: "분석 상태",
      key: "analysis_status",
      render: (value: IAiProductMetadataItem["analysis_status"]) =>
        statusLabel[value] || value,
    },
    { header: "시도 횟수", key: "analysis_attempt_count" },
    {
      header: "추천 제외",
      key: "exclude_from_recommend_yn",
      render: (value: "Y" | "N") => (value === "Y" ? "제외" : "포함"),
    },
    {
      header: "최근 분석일",
      key: "analyzed_at",
      render: (value: string | null) =>
        value ? format(new Date(value), "yyyy-MM-dd HH:mm") : "-",
    },
    {
      header: "오류",
      key: "analysis_error_message",
      render: (value: string | null) => value || "-",
    },
    {
      header: "작업",
      key: "actions",
      render: (_: unknown, row: IAiProductMetadataItem) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(row.product_id)}>
            편집
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReanalyze(row.product_id)}>
            재분석
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onToggleExclude(row.product_id, row.exclude_from_recommend_yn)
            }
          >
            {row.exclude_from_recommend_yn === "Y" ? "제외해제" : "추천제외"}
          </Button>
        </div>
      ),
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
