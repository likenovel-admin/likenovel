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

export const statusLabel: Record<IAiProductMetadataItem["analysis_status"], string> = {
  missing: "미생성",
  pending: "대기",
  success: "DNA 성공",
  failed: "실패",
};

const storyStatusLabel: Record<IAiProductMetadataItem["story_context_status"], string> = {
  missing: "미수집",
  pending: "대기",
  processing: "진행중",
  ready: "완료",
  failed: "실패",
  disabled: "비활성",
};

type AiMetadataProgress = Pick<
  IAiProductMetadataItem,
  | "analysis_status"
  | "story_context_status"
  | "story_ready_episode_no"
  | "story_total_episode_count"
>;

const isStoryContextComplete = (row: AiMetadataProgress) =>
  row.story_total_episode_count > 0 &&
  row.story_ready_episode_no >= row.story_total_episode_count;

export const formatAnalysisStatus = (row: AiMetadataProgress) => {
  const dnaStatus = statusLabel[row.analysis_status] || row.analysis_status;
  if (row.analysis_status !== "success") return dnaStatus;
  return `${dnaStatus} · 요약 ${isStoryContextComplete(row) ? "완료" : "미완료"}`;
};

export const formatStoryContextProgress = (row: AiMetadataProgress) => {
  const readyEpisodeNo = Number(row.story_ready_episode_no || 0);
  const totalEpisodeCount = Number(row.story_total_episode_count || 0);
  if (readyEpisodeNo <= 0 && totalEpisodeCount <= 0) {
    return storyStatusLabel[row.story_context_status] || row.story_context_status;
  }
  const progressStatus = isStoryContextComplete(row)
    ? "완료"
    : row.story_context_status === "failed" || row.story_context_status === "disabled"
      ? storyStatusLabel[row.story_context_status]
      : "진행중";
  return `${readyEpisodeNo}화까지 / 전체 ${totalEpisodeCount}화 · ${progressStatus}`;
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
      render: (_value: IAiProductMetadataItem["analysis_status"], row: IAiProductMetadataItem) =>
        formatAnalysisStatus(row),
    },
    {
      header: "회차요약",
      key: "story_context_status",
      render: (_value: IAiProductMetadataItem["story_context_status"], row: IAiProductMetadataItem) =>
        formatStoryContextProgress(row),
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
