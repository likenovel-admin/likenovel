"use client";

import { useRef, useState } from "react";

import {
  useFreeSerialScheduleApply,
  useFreeSerialSchedulePreview,
} from "@/api/free-serial-schedule";
import {
  IFreeSerialScheduleResponse,
  IFreeSerialScheduleRow,
} from "@/api/free-serial-schedule/dto";
import { SidebarInset } from "@/components/ui/sidebar";
import PageHeader from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";

const PER_PAGE = 20;

export default function FreeSerialSchedulePage() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [responseData, setResponseData] = useState<IFreeSerialScheduleResponse | null>(null);
  const [page, setPage] = useState(1);
  const [applied, setApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewMutation = useFreeSerialSchedulePreview();
  const applyMutation = useFreeSerialScheduleApply();

  const isLoading = previewMutation.isPending || applyMutation.isPending;
  const rows = responseData?.results ?? [];
  const summary = responseData?.summary;
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const pagedRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasErrors = rows.some((row) => row.errors.length > 0);

  const buildFormData = () => {
    const formData = new FormData();
    if (excelFile) {
      formData.append("excel", excelFile);
    }
    return formData;
  };

  const handlePreview = async () => {
    if (!excelFile) {
      await showAlert("알림", "엑셀 파일을 선택해주세요.", "확인");
      return;
    }

    previewMutation.mutate(buildFormData(), {
      onSuccess: async (res) => {
        setResponseData(res);
        setPage(1);
        setApplied(false);
        if (!res.success) {
          await showAlert("미리보기 실패", res.message, "확인");
          return;
        }
        if (res.summary?.error_row_count) {
          await showAlert(
            "검증 필요",
            `오류 ${res.summary.error_row_count}건이 포함되어 있습니다.`,
            "확인"
          );
        }
      },
      onError: async (error) => {
        await showAlert("미리보기 실패", catchErrorMessage(error), "확인");
      },
    });
  };

  const handleApply = async () => {
    if (!excelFile) {
      await showAlert("알림", "엑셀 파일을 선택해주세요.", "확인");
      return;
    }
    if (!responseData?.success || rows.length === 0) {
      await showAlert("알림", "먼저 미리보기를 실행해주세요.", "확인");
      return;
    }
    if (hasErrors) {
      await showAlert("적용 불가", "오류 행이 있어 적용할 수 없습니다.", "확인");
      return;
    }

    const result = await confirm({
      title: "예약 스케줄을 적용하시겠습니까?",
      text: "이미 공개된 회차는 건너뛰고, 미래 예약은 시트 기준으로 덮어씁니다.",
      confirm: "적용",
      cancel: "취소",
    });
    if (!result.isConfirmed) {
      return;
    }

    applyMutation.mutate(buildFormData(), {
      onSuccess: async (res) => {
        setResponseData(res);
        setPage(1);
        setApplied(res.success);
        await showAlert(res.success ? "적용 완료" : "적용 실패", res.message, "확인");
      },
      onError: async (error) => {
        await showAlert("적용 실패", catchErrorMessage(error), "확인");
      },
    });
  };

  return (
    <SidebarInset>
      <PageHeader title="무료연재 예약 스케줄" />
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-[#E7E9EE] bg-white p-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#1F2124]">
              스케줄 엑셀 파일 (.xlsx)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                setExcelFile(e.target.files?.[0] || null);
                setResponseData(null);
                setApplied(false);
              }}
              className="block cursor-pointer text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#4C63FF] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#3B4FCC]"
            />
          </div>
          <Button
            onClick={handlePreview}
            disabled={!excelFile || isLoading}
            className="bg-[#4C63FF] text-white hover:bg-[#3B4FCC]"
          >
            {previewMutation.isPending ? "미리보기 중..." : "미리보기"}
          </Button>
          <Button
            onClick={handleApply}
            disabled={!responseData?.success || isLoading || hasErrors}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {applyMutation.isPending ? "적용 중..." : "적용"}
          </Button>
          <a href="/free-serial-schedule-template.xlsx" download>
            <Button variant="outline" type="button">
              엑셀 양식 다운로드
            </Button>
          </a>
        </div>

        <p className="-mt-4 px-1 text-xs text-[#6C7383]">
          컬럼: <code className="rounded bg-gray-100 px-1">product_id</code>,{" "}
          <code className="rounded bg-gray-100 px-1">작품제목</code>,{" "}
          <code className="rounded bg-gray-100 px-1">시작회차</code>,{" "}
          <code className="rounded bg-gray-100 px-1">예약공개시작일</code>,{" "}
          <code className="rounded bg-gray-100 px-1">예약공개시각(HH:MM)</code>,{" "}
          <code className="rounded bg-gray-100 px-1">공개간격일수</code>,{" "}
          <code className="rounded bg-gray-100 px-1">덮어쓰기(Y/N)</code>,{" "}
          <code className="rounded bg-gray-100 px-1">제외회차(쉼표구분)</code>
        </p>
        <p className="-mt-4 px-1 text-xs text-[#6C7383]">
          예약공개시작일/시각은 현재 시간 기준 5분 이후부터 설정할 수 있습니다.
        </p>

        {summary && (
          <div className="rounded-lg border border-[#E7E9EE] bg-white px-5 py-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#6C7383]">
              <span>
                작품 <strong className="text-[#1F2124]">{summary.row_count}</strong>건
              </span>
              <span>
                대상 회차{" "}
                <strong className="text-[#1F2124]">{summary.matched_episode_count}</strong>건
              </span>
              <span className="text-green-700">
                신규 예약 {summary.new_reservation_count}건
              </span>
              <span className="text-blue-700">
                기존 예약 덮어쓰기 {summary.overwrite_reservation_count}건
              </span>
              <span className="text-[#D97706]">
                스킵 {summary.skipped_count}건
              </span>
              <span className={summary.error_row_count > 0 ? "text-[#E54949]" : ""}>
                오류 행 {summary.error_row_count}건
              </span>
              {applied && (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  적용 완료
                </span>
              )}
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-[#E7E9EE] bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[52px]">행</TableHead>
                  <TableHead className="w-[88px]">작품ID</TableHead>
                  <TableHead className="min-w-[180px]">작품명</TableHead>
                  <TableHead className="w-[90px]">시작회차</TableHead>
                  <TableHead className="w-[120px]">시작일</TableHead>
                  <TableHead className="w-[90px]">시각</TableHead>
                  <TableHead className="w-[90px]">간격</TableHead>
                  <TableHead className="w-[90px]">덮어쓰기</TableHead>
                  <TableHead className="w-[90px]">대상회차</TableHead>
                  <TableHead className="w-[90px]">신규</TableHead>
                  <TableHead className="w-[110px]">덮어씀</TableHead>
                  <TableHead className="w-[90px]">스킵</TableHead>
                  <TableHead className="min-w-[220px]">비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRows.map((row) => (
                  <TableRow
                    key={`${row.row}-${row.product_id ?? "none"}`}
                    className={row.errors.length > 0 ? "bg-red-50" : ""}
                  >
                    <TableCell>{row.row}</TableCell>
                    <TableCell>{row.product_id ?? "-"}</TableCell>
                    <TableCell className="max-w-[240px] truncate">
                      {row.title || row.sheet_title || "-"}
                    </TableCell>
                    <TableCell>{row.start_episode_no ?? "-"}</TableCell>
                    <TableCell>{row.schedule_start_date || "-"}</TableCell>
                    <TableCell>{row.schedule_time || "-"}</TableCell>
                    <TableCell>{row.interval_days ? `${row.interval_days}일` : "-"}</TableCell>
                    <TableCell>{row.overwrite_future_reserved}</TableCell>
                    <TableCell>{row.apply_target_count}</TableCell>
                    <TableCell>{row.new_reservation_count}</TableCell>
                    <TableCell>{row.overwrite_reservation_count}</TableCell>
                    <TableCell>{row.skipped_count}</TableCell>
                    <TableCell className="text-xs text-[#6C7383]">
                      {row.errors.length > 0
                        ? row.errors.join(", ")
                        : buildNotes(row)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 border-t border-[#E7E9EE] py-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  이전
                </Button>
                <span className="text-sm text-[#6C7383]">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  다음
                </Button>
              </div>
            )}
          </div>
        )}

        {!rows.length && !isLoading && (
          <div className="flex h-40 items-center justify-center rounded-lg border border-[#E7E9EE] bg-white text-sm text-[#6C7383]">
            스케줄 엑셀을 업로드하고 미리보기를 눌러주세요.
          </div>
        )}
      </div>
    </SidebarInset>
  );
}

function buildNotes(row: IFreeSerialScheduleRow) {
  const parts: string[] = [];

  if (row.first_schedule_at && row.last_schedule_at) {
    parts.push(`첫 예약 ${row.first_schedule_at}`);
    parts.push(`마지막 예약 ${row.last_schedule_at}`);
  }

  if (row.excluded_episode_nos.length > 0) {
    parts.push(`제외회차 ${row.excluded_episode_nos.join(",")}`);
  }

  const skipEntries = Object.entries(row.skip_reason_counts);
  if (skipEntries.length > 0) {
    parts.push(
      skipEntries.map(([reason, count]) => `${reason} ${count}건`).join(", ")
    );
  }

  return parts.join(" / ") || "-";
}
