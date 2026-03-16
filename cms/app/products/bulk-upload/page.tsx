"use client";

import { useState, useRef } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import PageHeader from "@/components/ui/page-header";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useBulkUploadPreview, useBulkUploadExecute } from "@/api/bulk-upload";
import { IBulkUploadPreviewItem, IBulkUploadExecuteResult } from "@/api/bulk-upload/dto";
import { showAlert } from "@/lib/utils";

type PreviewRow = IBulkUploadPreviewItem | IBulkUploadExecuteResult;

export default function BulkUploadPage() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [page, setPage] = useState(1);
  const [executed, setExecuted] = useState(false);
  const excelRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const previewMutation = useBulkUploadPreview();
  const executeMutation = useBulkUploadExecute();

  const PER_PAGE = 20;
  const totalPages = Math.ceil(previewData.length / PER_PAGE);
  const pagedData = previewData.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handlePreview = async () => {
    if (!excelFile) {
      await showAlert("엑셀 파일을 선택해주세요.");
      return;
    }
    const formData = new FormData();
    formData.append("excel", excelFile);
    if (zipFile) formData.append("zip_file", zipFile);

    previewMutation.mutate(formData, {
      onSuccess: (res) => {
        if (res.error) {
          showAlert("파싱 오류", res.error ?? "");
          return;
        }
        setPreviewData(res.results);
        setPage(1);
        setExecuted(false);
      },
      onError: () => {
        showAlert("미리보기 실패", "서버 오류가 발생했습니다.");
      },
    });
  };

  const handleExecute = async () => {
    if (!excelFile || !zipFile) {
      await showAlert("엑셀과 ZIP 파일 모두 필요합니다.");
      return;
    }
    if (previewData.length === 0) {
      await showAlert("미리보기 데이터가 없습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("excel", excelFile);
    formData.append("zip_file", zipFile);

    executeMutation.mutate(formData, {
      onSuccess: (res) => {
        setPreviewData(res.results);
        setPage(1);
        setExecuted(true);
        showAlert(res.message);
      },
      onError: () => {
        showAlert("일괄 생성 실패", "서버 오류가 발생했습니다.");
      },
    });
  };

  const hasErrors = previewData.some((r) => r.errors.length > 0);
  const isLoading = previewMutation.isPending || executeMutation.isPending;

  return (
    <SidebarInset>
      <PageHeader title="일괄 작품 업로드" />
      <div className="p-6 space-y-6">
        {/* 파일 업로드 영역 */}
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-[#E7E9EE] bg-white p-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#1F2124]">
              엑셀 파일 (.xlsx)
            </label>
            <input
              ref={excelRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => {
                setExcelFile(e.target.files?.[0] || null);
                setPreviewData([]);
                setExecuted(false);
              }}
              className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#4C63FF] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#3B4FCC] cursor-pointer"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#1F2124]">
              회차 ZIP 파일
            </label>
            <input
              ref={zipRef}
              type="file"
              accept=".zip"
              onChange={(e) => {
                setZipFile(e.target.files?.[0] || null);
                setPreviewData([]);
                setExecuted(false);
              }}
              className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#4C63FF] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#3B4FCC] cursor-pointer"
            />
          </div>
          <Button
            onClick={handlePreview}
            disabled={!excelFile || isLoading}
            className="bg-[#4C63FF] hover:bg-[#3B4FCC] text-white"
          >
            {previewMutation.isPending ? "파싱 중..." : "미리보기"}
          </Button>
        </div>

        {/* 상태 바 */}
        {previewData.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-[#E7E9EE] bg-white px-5 py-3">
            <div className="flex items-center gap-4 text-sm text-[#6C7383]">
              <span>총 <strong className="text-[#1F2124]">{previewData.length}</strong>건</span>
              {hasErrors && (
                <span className="text-[#E54949]">
                  오류 {previewData.filter((r) => r.errors.length > 0).length}건
                </span>
              )}
              {executed && (
                <>
                  <span className="text-green-600">
                    생성 {previewData.filter((r) => "status" in r && r.status === "created").length}건
                  </span>
                  <span className="text-[#E54949]">
                    실패 {previewData.filter((r) => "status" in r && r.status === "failed").length}건
                  </span>
                </>
              )}
            </div>
            {!executed && (
              <Button
                onClick={handleExecute}
                disabled={isLoading || hasErrors || !zipFile}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {executeMutation.isPending ? "생성 중..." : "일괄 생성 시작"}
              </Button>
            )}
          </div>
        )}

        {/* 미리보기 테이블 */}
        {previewData.length > 0 && (
          <div className="rounded-lg border border-[#E7E9EE] bg-white overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead className="w-[160px]">작가이메일</TableHead>
                  <TableHead className="w-[80px]">닉네임</TableHead>
                  <TableHead className="w-[150px]">작품제목</TableHead>
                  <TableHead className="w-[80px]">1차장르</TableHead>
                  <TableHead className="w-[60px]">회차수</TableHead>
                  <TableHead className="w-[80px]">연재주기</TableHead>
                  <TableHead className="w-[50px]">최초공개</TableHead>
                  <TableHead className="w-[90px]">예약시작일</TableHead>
                  <TableHead className="w-[60px]">계정</TableHead>
                  {executed && <TableHead className="w-[60px]">결과</TableHead>}
                  <TableHead>비고</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedData.map((row, i) => {
                  const isExec = "status" in row;
                  const execRow = row as IBulkUploadExecuteResult;
                  return (
                    <TableRow
                      key={i}
                      className={
                        row.errors.length > 0
                          ? "bg-red-50"
                          : isExec && execRow.status === "created"
                            ? "bg-green-50"
                            : isExec && execRow.status === "failed"
                              ? "bg-red-50"
                              : ""
                      }
                    >
                      <TableCell>{row.row}</TableCell>
                      <TableCell className="truncate max-w-[160px]">{row.email}</TableCell>
                      <TableCell>{row.nickname || "-"}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{row.title}</TableCell>
                      <TableCell>{row.genre1}</TableCell>
                      <TableCell>{row.episode_count || "-"}</TableCell>
                      <TableCell>{row.schedule_days}</TableCell>
                      <TableCell>{row.first_open_ep}화</TableCell>
                      <TableCell>{row.start_date || "-"}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${row.account_exists ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                          {row.account_exists ? "기존" : "신규"}
                        </span>
                      </TableCell>
                      {executed && (
                        <TableCell>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                            execRow.status === "created" ? "bg-green-100 text-green-700" :
                            execRow.status === "skipped" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {execRow.status === "created" ? "완료" : execRow.status === "skipped" ? "건너뜀" : "실패"}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-xs text-[#6C7383]">
                        {row.errors.length > 0
                          ? row.errors.join(", ")
                          : isExec && execRow.message
                            ? execRow.message
                            : isExec && execRow.product_id
                              ? `작품ID: ${execRow.product_id}, ${execRow.episodes_created}화`
                              : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-[#E7E9EE]">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
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
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 빈 상태 */}
        {previewData.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-40 rounded-lg border border-[#E7E9EE] bg-white text-sm text-[#6C7383]">
            엑셀과 ZIP 파일을 업로드하고 미리보기를 눌러주세요.
          </div>
        )}
      </div>
    </SidebarInset>
  );
}
