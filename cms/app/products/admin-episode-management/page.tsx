"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminDelegatedEpisodeAction,
  IAdminDelegatedEpisodeItemRequest,
} from "@/api/adminEpisodeManagement/dto";
import {
  useAdminDelegatedEpisodeApply,
  useAdminDelegatedEpisodePreview,
  useAdminDelegatedEpisodeSummary,
} from "@/api/adminEpisodeManagement";
import { useCreateUpload, useUpdateUpload } from "@/api/upload";
import { showAlert } from "@/lib/utils";

type UploadRow = {
  key: string;
  file: File;
  episodeNo: number;
  title: string;
  sourceSha256: string | null;
  epubFileId: number | null;
  uploadStatus: "pending" | "uploaded" | "failed";
  error?: string;
};

const extractEpisodeNo = (fileName: string) => {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const matches = baseName.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  return Number(matches[matches.length - 1]);
};

const sha256 = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const toBackendReserveIsoString = (localDatetime: string) => {
  if (!localDatetime) return null;
  const normalized = localDatetime.length === 16 ? `${localDatetime}:00` : localDatetime;
  const date = new Date(`${normalized}+09:00`);
  if (Number.isNaN(date.getTime())) return null;

  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join("-") + `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
};

const addDaysToLocalDatetime = (localDatetime: string, days: number) => {
  const match = localDatetime.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!match) return localDatetime;
  const [, year, month, day, hour, minute, second = "00"] = match;
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    )
  );
  date.setUTCDate(date.getUTCDate() + days);

  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join("-") + `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
};

export default function AdminEpisodeManagementPage() {
  const [productIdInput, setProductIdInput] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [action, setAction] = useState<AdminDelegatedEpisodeAction>("append_epub");
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [publishReserveStart, setPublishReserveStart] = useState("");
  const [publishIntervalDays, setPublishIntervalDays] = useState(1);
  const [isPreparing, setIsPreparing] = useState(false);
  const [previewRequestFingerprint, setPreviewRequestFingerprint] = useState<string | null>(null);

  const productId = Number(productIdInput);
  const summaryQuery = useAdminDelegatedEpisodeSummary(
    selectedProductId,
    selectedProductId != null
  );
  const createUpload = useCreateUpload();
  const updateUpload = useUpdateUpload();
  const previewMutation = useAdminDelegatedEpisodePreview();
  const applyMutation = useAdminDelegatedEpisodeApply();

  const summary = summaryQuery.data?.data.product;
  const preview = previewMutation.data?.data;
  const isBusy =
    isPreparing ||
    createUpload.isPending ||
    updateUpload.isPending ||
    previewMutation.isPending ||
    applyMutation.isPending;

  const requestBody = useMemo(() => {
    const sortedRows = [...rows].sort((a, b) => a.episodeNo - b.episodeNo);
    const episodes: IAdminDelegatedEpisodeItemRequest[] = sortedRows
      .filter((row) => row.epubFileId != null)
      .map((row, index) => {
        const publishReserveDate = action === "append_epub" && publishReserveStart
          ? addDaysToLocalDatetime(publishReserveStart, index * publishIntervalDays)
          : "";
        return {
          episode_no: row.episodeNo,
          title: row.title,
          epub_file_id: row.epubFileId as number,
          source_sha256: row.sourceSha256,
          evaluation_open_yn: "Y",
          comment_open_yn: "Y",
          publish_reserve_yn: publishReserveDate ? "Y" : "N",
          publish_reserve_date: toBackendReserveIsoString(publishReserveDate),
          price_type: null,
        };
      });
    return { action, episodes };
  }, [action, rows, publishReserveStart, publishIntervalDays]);
  const requestBodyFingerprint = useMemo(
    () => JSON.stringify(requestBody),
    [requestBody]
  );

  const handleLoadProduct = async () => {
    if (!Number.isInteger(productId) || productId <= 0) {
      await showAlert("작품 ID를 숫자로 입력해주세요.");
      return;
    }
    setSelectedProductId(productId);
    previewMutation.reset();
    setPreviewRequestFingerprint(null);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const nextRows = Array.from(files)
      .filter((file) => file.name.toLowerCase().endsWith(".epub"))
      .map((file) => {
        const episodeNo = extractEpisodeNo(file.name);
        return {
          key: `${file.name}-${file.size}-${file.lastModified}`,
          file,
          episodeNo: episodeNo ?? 0,
          title: episodeNo ? `${episodeNo}화.` : file.name.replace(/\.[^.]+$/, ""),
          sourceSha256: null,
          epubFileId: null,
          uploadStatus: episodeNo ? "pending" : "failed",
          error: episodeNo ? undefined : "파일명에서 회차 번호를 찾지 못했습니다.",
        } satisfies UploadRow;
      })
      .sort((a, b) => a.episodeNo - b.episodeNo);
    setRows(nextRows);
    previewMutation.reset();
    setPreviewRequestFingerprint(null);
  };

  const updateRow = (key: string, patch: Partial<UploadRow>) => {
    previewMutation.reset();
    setPreviewRequestFingerprint(null);
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  };

  const handlePrepareUploads = async () => {
    if (rows.length === 0) {
      await showAlert("EPUB 파일을 선택해주세요.");
      return;
    }
    const invalidRow = rows.find((row) => row.episodeNo <= 0);
    if (invalidRow) {
      await showAlert("회차 번호를 확인해주세요.", invalidRow.file.name);
      return;
    }

    setIsPreparing(true);
    previewMutation.reset();
    try {
      for (const row of rows) {
        if (row.epubFileId != null) continue;
        try {
          const sourceSha256 = await sha256(row.file);
          const upload = await createUpload.mutateAsync({
            group_type: "epub",
            file_name: row.file.name,
          });
          await updateUpload.mutateAsync({
            url: upload.data.uploadPath,
            file: row.file,
            file_type: row.file.type || "application/epub+zip",
          });
          updateRow(row.key, {
            sourceSha256,
            epubFileId: upload.data.fileId,
            uploadStatus: "uploaded",
            error: undefined,
          });
        } catch (error) {
          updateRow(row.key, {
            uploadStatus: "failed",
            error: error instanceof Error ? error.message : "업로드 실패",
          });
          throw error;
        }
      }
    } finally {
      setIsPreparing(false);
    }
  };

  const handlePreview = async () => {
    if (!selectedProductId) {
      await showAlert("작품을 먼저 조회해주세요.");
      return;
    }
    if (requestBody.episodes.length !== rows.length) {
      await showAlert("모든 EPUB 업로드를 먼저 완료해주세요.");
      return;
    }
    previewMutation.mutate(
      { productId: selectedProductId, body: requestBody },
      {
        onSuccess: () => setPreviewRequestFingerprint(requestBodyFingerprint),
        onError: (error) => showAlert("미리보기 실패", error.message),
      }
    );
  };

  const handleApply = async () => {
    if (!selectedProductId) return;
    if (!preview || preview.errors.length > 0) {
      await showAlert("오류 없는 미리보기 이후에만 적용할 수 있습니다.");
      return;
    }
    if (previewRequestFingerprint !== requestBodyFingerprint) {
      await showAlert("미리보기 이후 변경된 내용이 있습니다.", "다시 미리보기를 실행해주세요.");
      return;
    }
    applyMutation.mutate(
      { productId: selectedProductId, body: requestBody },
      {
        onSuccess: (res) => {
          showAlert(`적용 완료: ${res.data.count}개 회차`);
          summaryQuery.refetch();
        },
        onError: (error) => showAlert("적용 실패", error.message),
      }
    );
  };

  const hasPreviewError = Boolean(preview && preview.errors.length > 0);
  const hasStalePreview = Boolean(
    preview && previewRequestFingerprint !== requestBodyFingerprint
  );
  const uploadedCount = rows.filter((row) => row.epubFileId != null).length;

  return (
    <SidebarInset>
      <PageHeader title="관리자 대리 회차 관리" />
      <div className="space-y-6 p-6">
        <section className="rounded-lg border border-[#E7E9EE] bg-white p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1F2124]">
                작품 ID
              </label>
              <input
                value={productIdInput}
                onChange={(event) => setProductIdInput(event.target.value)}
                className="h-10 w-[180px] rounded-md border border-[#D8DDE8] px-3 text-sm"
                placeholder="예: 1105"
              />
            </div>
            <Button onClick={handleLoadProduct} disabled={isBusy}>
              작품 조회
            </Button>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1F2124]">
                작업
              </label>
              <select
                value={action}
                onChange={(event) => {
                  setAction(event.target.value as AdminDelegatedEpisodeAction);
                  previewMutation.reset();
                  setPreviewRequestFingerprint(null);
                }}
                className="h-10 rounded-md border border-[#D8DDE8] px-3 text-sm"
              >
                <option value="append_epub">후속 회차 추가</option>
                <option value="replace_epub">기존 회차 내용 교체</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1F2124]">
                예약 공개 시작 일시
              </label>
              <input
                type="datetime-local"
                value={publishReserveStart}
                disabled={action === "replace_epub"}
                onChange={(event) => {
                  setPublishReserveStart(event.target.value);
                  previewMutation.reset();
                  setPreviewRequestFingerprint(null);
                }}
                className="h-10 rounded-md border border-[#D8DDE8] px-3 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#1F2124]">
                공개 간격일수
              </label>
              <input
                type="number"
                min={0}
                value={publishIntervalDays}
                disabled={action === "replace_epub"}
                onChange={(event) => {
                  setPublishIntervalDays(Math.max(0, Number(event.target.value) || 0));
                  previewMutation.reset();
                  setPreviewRequestFingerprint(null);
                }}
                className="h-10 w-[120px] rounded-md border border-[#D8DDE8] px-3 text-sm"
              />
            </div>
          </div>

          {summary && (
            <div className="mt-4 grid gap-2 rounded-md bg-[#F7F8FB] p-4 text-sm text-[#424752] md:grid-cols-4">
              <div>작품명: {summary.title}</div>
              <div>작가: {summary.authorName || "-"}</div>
              <div>이메일: {summary.authorEmail || "-"}</div>
              <div>
                현재 회차: {summary.episodeCount}개 / 최신 {summary.maxEpisodeNo}화
              </div>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-[#E7E9EE] bg-white p-5">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".epub"
              multiple
              onChange={(event) => handleFiles(event.target.files)}
              className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#4C63FF] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#3B4FCC]"
            />
            <Button
              onClick={handlePrepareUploads}
              disabled={isBusy || rows.length === 0}
              variant="outline"
            >
              {isPreparing ? "EPUB 업로드 중..." : "EPUB 업로드 준비"}
            </Button>
            <Button onClick={handlePreview} disabled={isBusy || uploadedCount === 0}>
              {previewMutation.isPending ? "검증 중..." : "미리보기"}
            </Button>
            <Button
              onClick={handleApply}
              disabled={isBusy || !preview || hasPreviewError || hasStalePreview}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {applyMutation.isPending ? "적용 중..." : "적용"}
            </Button>
          </div>
          <p className="mt-3 text-xs text-[#6C7383]">
            파일명에서 마지막 숫자를 회차 번호로 읽습니다. 예약 시작일시는 후속 회차 추가에서만 적용됩니다.
          </p>
        </section>

        {rows.length > 0 && (
          <section className="overflow-x-auto rounded-lg border border-[#E7E9EE] bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">회차</TableHead>
                  <TableHead className="w-[280px]">회차명</TableHead>
                  <TableHead>파일명</TableHead>
                  <TableHead className="w-[120px]">업로드</TableHead>
                  <TableHead className="w-[220px]">미리보기</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const previewItem = preview?.items.find(
                    (item) => item.episodeNo === row.episodeNo
                  );
                  return (
                    <TableRow
                      key={row.key}
                      className={
                        row.uploadStatus === "failed" ||
                        (previewItem && previewItem.errors.length > 0)
                          ? "bg-red-50"
                          : ""
                      }
                    >
                      <TableCell>
                        <input
                          type="number"
                          value={row.episodeNo || ""}
                          onChange={(event) =>
                            updateRow(row.key, {
                              episodeNo: Number(event.target.value),
                            })
                          }
                          className="h-9 w-[76px] rounded-md border border-[#D8DDE8] px-2 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          value={row.title}
                          onChange={(event) =>
                            updateRow(row.key, { title: event.target.value })
                          }
                          className="h-9 w-full rounded-md border border-[#D8DDE8] px-2 text-sm"
                        />
                      </TableCell>
                      <TableCell className="text-sm">{row.file.name}</TableCell>
                      <TableCell className="text-sm">
                        {row.uploadStatus === "uploaded"
                          ? `완료 #${row.epubFileId}`
                          : row.uploadStatus === "failed"
                            ? row.error || "실패"
                            : "대기"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {previewItem
                          ? previewItem.errors.length > 0
                            ? previewItem.errors.join(", ")
                            : `${previewItem.priceType} / ${previewItem.textCount}자${
                                previewItem.publishReserveDate
                                  ? ` / ${previewItem.publishReserveDate}`
                                  : ""
                              }`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </section>
        )}

        {preview && (
          <section className="rounded-lg border border-[#E7E9EE] bg-white p-4 text-sm">
            <div className="font-semibold text-[#1F2124]">미리보기 결과</div>
            <div className="mt-2 text-[#6C7383]">
              operation key: {preview.idempotencyKey}
            </div>
            {preview.errors.length > 0 ? (
              <ul className="mt-3 space-y-1 text-[#E54949]">
                {preview.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : hasStalePreview ? (
              <div className="mt-3 text-[#E58A00]">
                미리보기 이후 입력값이 변경되었습니다. 다시 미리보기를 실행해주세요.
              </div>
            ) : (
              <div className="mt-3 text-green-700">
                오류 없음. 적용 시 {preview.items.length}개 회차가 처리됩니다.
              </div>
            )}
          </section>
        )}
      </div>
    </SidebarInset>
  );
}
