"use client";

import {
  TOpenYn,
} from "@/api/product-episode-upload/dto";
import {
  useUploadBatchEpisodeEpub,
} from "@/api/product-episode-upload";
import { useGetProductDetail } from "@/api/product";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProfile } from "@/hooks/useProfile";
import apiClient from "@/lib/apiClient";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { ChevronLeft, FilePlus2, Trash2, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

type EpisodeUploadOption = {
  title: string;
  authorComment: string;
  evaluationOpenYn: TOpenYn;
  commentOpenYn: TOpenYn;
};

type BatchFileRow = {
  id: string;
  file: File;
  fileName: string;
  title: string;
  authorComment: string;
  status: "idle" | "uploading" | "ready" | "done" | "error";
  statusMessage?: string;
  episodeId?: number;
};

type UploadProgressState = {
  phase: "idle" | "uploading" | "registering" | "completed" | "error";
  current: number;
  total: number;
};

const DEFAULT_EPISODE_OPTION: EpisodeUploadOption = {
  title: "",
  authorComment: "",
  evaluationOpenYn: "Y",
  commentOpenYn: "Y",
};

const extractTitleFromFileName = (fileName: string) =>
  fileName.trim().replace(/\.epub$/i, "");
const BATCH_UPLOAD_CHUNK_SIZE = 200;

const buildEpisodePayload = (
  option: EpisodeUploadOption,
  epubFileId: number
) => {
  return {
    title: option.title.trim(),
    epub_file_id: epubFileId,
    author_comment: option.authorComment.trim() || undefined,
    evaluation_open_yn: option.evaluationOpenYn,
    comment_open_yn: option.commentOpenYn,
    episode_open_yn: "N" as TOpenYn,
    publish_reserve_yn: "N" as TOpenYn,
  };
};

function EpisodeOptionFields({
  value,
  onChange,
}: {
  value: EpisodeUploadOption;
  onChange: (patch: Partial<EpisodeUploadOption>) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-[#1F2124]">
          별점 공개
        </label>
        <Select
          value={value.evaluationOpenYn}
          onValueChange={(val) => onChange({ evaluationOpenYn: val as TOpenYn })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Y">공개</SelectItem>
            <SelectItem value="N">비공개</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#1F2124]">
          댓글 공개
        </label>
        <Select
          value={value.commentOpenYn}
          onValueChange={(val) => onChange({ commentOpenYn: val as TOpenYn })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Y">공개</SelectItem>
            <SelectItem value="N">비공개</SelectItem>
          </SelectContent>
        </Select>
      </div>

    </div>
  );
}

export default function UploadEpisodesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { userProfile, isInitialized } = useProfile();
  const productId = searchParams.get("productId") ?? "";
  const { data: productDetail, isLoading: isLoadingProduct } = useGetProductDetail(
    productId,
    !!productId
  );

  const uploadBatchEpisode = useUploadBatchEpisodeEpub();

  const canManage =
    userProfile?.role_type === "admin" || userProfile?.role_type === "CP";

  const [batchCommonOption, setBatchCommonOption] =
    useState<EpisodeUploadOption>(DEFAULT_EPISODE_OPTION);
  const [batchFiles, setBatchFiles] = useState<BatchFileRow[]>([]);
  const [uploadedEpisodeIds, setUploadedEpisodeIds] = useState<number[]>([]);
  const [isUploadingToStorage, setIsUploadingToStorage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState>({
    phase: "idle",
    current: 0,
    total: 0,
  });

  const isMutating =
    isUploadingToStorage || uploadBatchEpisode.isPending;
  const loaderLabel =
    uploadProgress.phase === "uploading"
      ? "EPUB 업로드 중"
      : uploadProgress.phase === "registering"
        ? "회차 등록 중"
        : uploadProgress.phase === "completed"
          ? "업로드 완료"
          : uploadProgress.phase === "error"
            ? "업로드 실패"
            : "업로드 처리 중";
  const loaderProgressText =
    uploadProgress.total > 0
      ? `${Math.min(uploadProgress.current, uploadProgress.total)}/${uploadProgress.total}`
      : undefined;

  const updateBatchRow = (rowId: string, patch: Partial<BatchFileRow>) => {
    setBatchFiles((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row))
    );
  };

  const requestEpubUploadUrl = async (fileName: string) => {
    const res = await apiClient.request<{
      data: { fileId: number; uploadPath: string };
    }>({
      url: "/v1/command/storages/upload-url",
      method: "POST",
      body: {
        group_type: "epub",
        file_name: fileName,
      },
    });
    return res.data;
  };

  const uploadEpubFile = async (file: File) => {
    const uploadMeta = await requestEpubUploadUrl(file.name);
    const uploadResponse = await fetch(uploadMeta.uploadPath, {
      method: "PUT",
      headers: {
        "Content-Type": "application/epub+zip",
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`EPUB 업로드 실패(${uploadResponse.status})`);
    }

    return uploadMeta.fileId;
  };

  const handleAfterUpload = async (episodeIds: number[]) => {
    if (!episodeIds.length) return false;

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["GetProductParams"] }),
      queryClient.invalidateQueries({
        queryKey: ["GetProductDetail", JSON.stringify(productId)],
      }),
      queryClient.invalidateQueries({
        queryKey: ["GetProductDetailsGroup", JSON.stringify(productId)],
      }),
    ]);

    await showAlert(
      "업로드 완료",
      `${episodeIds.length}건 업로드되었습니다. 작품 및 회차목록에서 심사요청을 진행해주세요.`,
      "확인"
    );
    router.push(`/products/upload?mode=view&id=${productId}`);
    return true;
  };

  const handleBatchFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const validFiles = files.filter((file) => file.name.toLowerCase().endsWith(".epub"));
    if (validFiles.length !== files.length) {
      showAlert(
        "파일 형식 오류",
        "선택한 파일 중 EPUB이 아닌 파일은 제외되었습니다.",
        "확인"
      );
    }

    const rows: BatchFileRow[] = validFiles.map((file, index) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${index}`,
      file,
      fileName: file.name,
      title: extractTitleFromFileName(file.name),
      authorComment: "",
      status: "idle",
    }));

    setBatchFiles((prev) => [...prev, ...rows]);
  };

  const handleUploadBatch = async () => {
    if (!productId) {
      showAlert("작품 선택 오류", "작품 ID가 없습니다.", "확인");
      return;
    }
    if (!batchFiles.length) {
      showAlert("입력 확인", "업로드할 EPUB 파일을 선택해주세요.", "확인");
      return;
    }

    const invalidTitle = batchFiles.find((row) => !row.title.trim());
    if (invalidTitle) {
      showAlert("입력 확인", `${invalidTitle.fileName}의 회차 제목을 입력해주세요.`, "확인");
      return;
    }

    setUploadProgress({
      phase: "uploading",
      current: 0,
      total: batchFiles.length,
    });
    setIsUploadingToStorage(true);
    try {
      const episodes: ReturnType<typeof buildEpisodePayload>[] = [];

      for (let i = 0; i < batchFiles.length; i += 1) {
        const row = batchFiles[i];
        updateBatchRow(row.id, { status: "uploading", statusMessage: "파일 업로드 중" });

        const fileId = await uploadEpubFile(row.file);
        setUploadProgress({
          phase: "uploading",
          current: i + 1,
          total: batchFiles.length,
        });
        const payload = buildEpisodePayload(
          {
            ...batchCommonOption,
            title: row.title,
            authorComment: row.authorComment,
          },
          fileId
        );

        episodes.push(payload);
        updateBatchRow(row.id, { status: "ready", statusMessage: "파일 업로드 완료" });
      }
      setUploadProgress({
        phase: "registering",
        current: episodes.length,
        total: episodes.length,
      });

      const allEpisodeIds: number[] = [];
      for (let idx = 0; idx < episodes.length; idx += BATCH_UPLOAD_CHUNK_SIZE) {
        const chunk = episodes.slice(idx, idx + BATCH_UPLOAD_CHUNK_SIZE);
        const res = await uploadBatchEpisode.mutateAsync({
          productId,
          body: { episodes: chunk },
        });
        allEpisodeIds.push(...(res.data.episodeIds ?? []));
      }

      const episodeIds = allEpisodeIds;
      setUploadedEpisodeIds((prev) => [...prev, ...episodeIds]);
      setBatchFiles((prev) =>
        prev.map((row, index) => ({
          ...row,
          status: "done",
          statusMessage: "등록 완료",
          episodeId: episodeIds[index],
        }))
      );
      setUploadProgress({
        phase: "completed",
        current: episodeIds.length,
        total: episodes.length,
      });
      const moved = await handleAfterUpload(episodeIds);
      if (moved) return;
    } catch (error) {
      setUploadProgress((prev) => ({ ...prev, phase: "error" }));
      setBatchFiles((prev) =>
        prev.map((row) =>
          row.status === "done"
            ? row
            : { ...row, status: "error", statusMessage: "실패" }
        )
      );
      showAlert("일괄 업로드 실패", catchErrorMessage(error), "확인");
    } finally {
      setIsUploadingToStorage(false);
    }
  };

  if (!isInitialized || isLoadingProduct) {
    return <FullPageLoader isLoading={true} />;
  }

  if (!canManage) {
    return (
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="회차 업로드" parent="작품 관리" child="회차 업로드" />
        <div className="p-4">
          <div className="rounded-xl border border-[#E7E9EE] bg-white p-6 text-sm text-[#4A4F58]">
            관리자/출판사만 회차 업로드 기능을 사용할 수 있습니다.
          </div>
        </div>
      </SidebarInset>
    );
  }

  if (!productId || !productDetail) {
    return (
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="회차 업로드" parent="작품 관리" child="회차 업로드" />
        <div className="p-4">
          <div className="rounded-xl border border-[#E7E9EE] bg-white p-6 text-sm text-[#4A4F58]">
            작품 정보를 찾을 수 없습니다.
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.push("/products")}>
                작품 리스트로 이동
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="회차 업로드" parent="작품 관리" child="회차 업로드" />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="rounded-xl border border-[#E7E9EE] bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-[#707787]">작품 ID: {productDetail.product_id}</p>
              <h2 className="text-lg font-semibold text-[#171A1E]">
                {productDetail.title}
              </h2>
            </div>
            <Button variant="outline" onClick={() => router.push("/products")}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              작품 리스트로
            </Button>
          </div>

          <div className="space-y-4 rounded-lg border border-[#E7E9EE] bg-[#FCFDFF] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-[#1F2124]">EPUB 파일 목록</p>
                <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-[#D5D9E3] bg-white px-4 text-sm font-medium text-[#1F2124] hover:bg-[#F8FAFF]">
                  <Upload className="h-4 w-4" />
                  여러 파일 선택
                  <input
                    type="file"
                    accept=".epub,application/epub+zip"
                    multiple
                    className="hidden"
                    onChange={handleBatchFileChange}
                  />
                </label>
              </div>
              <Button
                variant="outline"
                onClick={() => setBatchFiles([])}
                disabled={!batchFiles.length || isMutating}
              >
                목록 비우기
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">파일명</TableHead>
                  <TableHead>회차 제목</TableHead>
                  <TableHead className="w-[120px]">상태</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchFiles.length ? (
                  batchFiles.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs text-[#525866]">{row.fileName}</TableCell>
                      <TableCell>
                        <Input
                          value={row.title}
                          onChange={(e) =>
                            updateBatchRow(row.id, { title: e.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.statusMessage ||
                          (row.status === "done" && row.episodeId
                            ? `등록완료(ID:${row.episodeId})`
                            : "업로드 전")}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isMutating}
                          onClick={() =>
                            setBatchFiles((prev) => prev.filter((item) => item.id !== row.id))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-[#707787]">
                      선택한 파일이 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <EpisodeOptionFields
              value={batchCommonOption}
              onChange={(patch) =>
                setBatchCommonOption((prev) => ({
                  ...prev,
                  ...patch,
                }))
              }
            />

            <div className="flex justify-end">
              <Button onClick={handleUploadBatch} disabled={isMutating || !batchFiles.length}>
                <FilePlus2 className="mr-1 h-4 w-4" />
                일괄 업로드 실행
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#E7E9EE] bg-white p-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-[#171A1E]">업로드 결과</h3>
          </div>

          <p className="mb-2 text-sm text-[#5F6675]">
            업로드된 회차 ID:{" "}
            {uploadedEpisodeIds.length ? uploadedEpisodeIds.join(", ") : "없음"}
          </p>
          <p className="text-xs text-[#80889A]">
            업로드 후 작품 및 회차목록에서 체크박스로 심사요청/취소를 진행할 수 있습니다.
          </p>
        </div>
      </div>

      <FullPageLoader
        isLoading={isMutating}
        label={loaderLabel}
        progressText={loaderProgressText}
      />
    </SidebarInset>
  );
}

