"use client";

import { TableCell, TableHead, TableRow } from "@/components/ui/table";

export type DirectRecommendSourceType = "manual" | "external_distribution";
export type DirectRecommendExternalPlatform = "kakaopage" | "ridi";

export const EXTERNAL_PLATFORM_LABELS: Record<
  DirectRecommendExternalPlatform,
  string
> = {
  kakaopage: "카카오페이지",
  ridi: "리디",
};

export const isExternalSource = (sourceType: DirectRecommendSourceType) =>
  sourceType === "external_distribution";

export const describeDirectRecommendSource = (row: {
  source_type?: string | null;
  source_platform?: string | null;
}) => {
  if (row.source_type !== "external_distribution") return null;
  const label =
    EXTERNAL_PLATFORM_LABELS[row.source_platform as DirectRecommendExternalPlatform] ??
    row.source_platform ??
    "-";
  return `외부 유통 자동 · ${label}`;
};

interface Props {
  sourceType: DirectRecommendSourceType;
  platform: DirectRecommendExternalPlatform;
  onSourceTypeChange: (value: DirectRecommendSourceType) => void;
  onPlatformChange: (value: DirectRecommendExternalPlatform) => void;
}

const selectClassName =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm";

export default function DirectRecommendSourceRows({
  sourceType,
  platform,
  onSourceTypeChange,
  onPlatformChange,
}: Props) {
  return (
    <TableRow>
      <TableHead className="require">구성 방식</TableHead>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="구성 방식"
            className={selectClassName}
            value={sourceType}
            onChange={(e) =>
              onSourceTypeChange(e.target.value as DirectRecommendSourceType)
            }
          >
            <option value="manual">작품 직접 입력</option>
            <option value="external_distribution">외부 유통 자동</option>
          </select>
          {isExternalSource(sourceType) && (
            <select
              aria-label="외부 유통 플랫폼"
              className={selectClassName}
              value={platform}
              onChange={(e) =>
                onPlatformChange(
                  e.target.value as DirectRecommendExternalPlatform
                )
              }
            >
              {Object.entries(EXTERNAL_PLATFORM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
        {isExternalSource(sourceType) && (
          <p className="mt-2 text-sm text-muted-foreground">
            외부 유통 현황에서 노출 여부가 Y인 작품이 자동으로 노출됩니다.
            작품 목록은 입력하지 않습니다.
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}
