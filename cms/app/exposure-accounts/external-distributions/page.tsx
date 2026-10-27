"use client";

import {
  useAddExternalDistribution,
  useDeleteExternalDistribution,
  useGetExternalDistributions,
  useUpdateExternalDistributionStatus,
} from "@/api/externalDistribution";
import type {
  ExternalDistributionPlatform,
  IExternalDistribution,
} from "@/api/externalDistribution/dto";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  calculatePageCount,
  catchErrorMessage,
  confirm,
  showAlert,
} from "@/lib/utils";
import { useState } from "react";
import { EXTERNAL_PLATFORM_LABELS } from "../direct-recommend/sourceFields";
import { buildExternalUrl, parseExternalId } from "./externalId";

const COUNT_PER_PAGE = 50;
const MATCH_METHOD_LABELS: Record<IExternalDistribution["matchMethod"], string> = {
  exact: "자동(제목 일치)",
  author_similar: "자동(작가+유사 제목)",
  manual: "수동 등록",
};
const selectClassName =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm";

export default function Page() {
  const [page, setPage] = useState(1);
  const [platformFilter, setPlatformFilter] = useState<
    ExternalDistributionPlatform | ""
  >("");
  const [newProductId, setNewProductId] = useState("");
  const [newPlatform, setNewPlatform] =
    useState<ExternalDistributionPlatform>("kakaopage");
  const [newExternal, setNewExternal] = useState("");

  const { data, refetch, isLoading, isFetching } = useGetExternalDistributions({
    page,
    count_per_page: COUNT_PER_PAGE,
    platform: platformFilter || undefined,
  });
  const addMapping = useAddExternalDistribution();
  const updateStatus = useUpdateExternalDistributionStatus();
  const deleteMapping = useDeleteExternalDistribution();

  const onError = (err: unknown) =>
    showAlert("오류", catchErrorMessage(err), "확인");

  const handleAdd = () => {
    const productId = Number(newProductId.trim());
    if (!Number.isInteger(productId) || productId <= 0) {
      showAlert("오류", "작품 ID를 숫자로 입력해주세요.", "확인");
      return;
    }
    const externalId = parseExternalId(newPlatform, newExternal);
    if (!externalId) {
      showAlert(
        "오류",
        `${EXTERNAL_PLATFORM_LABELS[newPlatform]} 작품 URL 또는 작품 번호를 입력해주세요.`,
        "확인"
      );
      return;
    }
    addMapping.mutate(
      { product_id: productId, platform: newPlatform, external_id: externalId },
      {
        onSuccess: () => {
          setNewProductId("");
          setNewExternal("");
          refetch();
        },
        onError,
      }
    );
  };

  const handleToggle = (row: IExternalDistribution) => {
    updateStatus.mutate(
      { id: row.id, status: row.status === "active" ? "hidden" : "active" },
      { onSuccess: () => refetch(), onError }
    );
  };

  const handleDelete = async (row: IExternalDistribution) => {
    const result = await confirm({
      title: "외부 유통 매핑을 삭제하시겠습니까?",
      text: "자동 매칭 작품은 다음 수집 때 다시 등록될 수 있습니다. 계속 숨기려면 삭제 대신 숨김을 사용하세요.",
      confirm: "삭제",
      cancel: "취소",
    });
    if (!result.isConfirmed) return;
    deleteMapping.mutate(row.id, { onSuccess: () => refetch(), onError });
  };

  const columns: Column[] = [
    {
      header: "플랫폼",
      key: "platform",
      render: (value: ExternalDistributionPlatform) =>
        EXTERNAL_PLATFORM_LABELS[value] ?? value,
    },
    {
      header: "라이크노벨 작품",
      key: "productTitle",
      render: (_, row: IExternalDistribution) => (
        <div>
          <div>
            [{row.productId}] {row.productTitle}
          </div>
          <div className="text-xs text-muted-foreground">{row.authorName}</div>
        </div>
      ),
    },
    {
      header: "외부 연재본",
      key: "externalTitle",
      render: (_, row: IExternalDistribution) => (
        <div>
          <a
            href={buildExternalUrl(row.platform, row.externalId)}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {row.externalTitle || row.externalId}
          </a>
          <div className="text-xs text-muted-foreground">
            {row.externalAuthor} · {MATCH_METHOD_LABELS[row.matchMethod]}
          </div>
        </div>
      ),
    },
    { header: "공개 회차", key: "openEpisodeCount" },
    {
      header: "노출 여부",
      key: "visibleYn",
      render: (_, row: IExternalDistribution) => (
        <div>
          <div className="font-semibold">{row.visibleYn}</div>
          <div className="text-xs text-muted-foreground">
            {row.status === "hidden" ? "숨김" : "노출 설정"} · 미확인 {row.missCount}회
          </div>
        </div>
      ),
    },
    {
      header: "마지막 확인",
      key: "lastSeenAt",
      render: (value: string) => (value ? String(value).replace("T", " ").slice(0, 16) : "-"),
    },
    {
      header: "관리",
      key: "actions",
      render: (_, row: IExternalDistribution) => (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleToggle(row)}>
            {row.status === "active" ? "숨김" : "노출"}
          </Button>
          <Button variant="outline" onClick={() => handleDelete(row)}>
            삭제
          </Button>
        </div>
      ),
    },
  ];

  const isBusy =
    isLoading ||
    isFetching ||
    addMapping.isPending ||
    updateStatus.isPending ||
    deleteMapping.isPending;

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4"></div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1>외부 유통 현황</h1>
        <p className="text-sm text-muted-foreground">
          수집기가 카카오페이지·리디에서 확인한 유료연재 작품입니다. 노출 여부가
          Y인 작품만 외부 유통 자동 구좌와 더보기 페이지에 노출됩니다.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="플랫폼 필터"
            className={selectClassName}
            value={platformFilter}
            onChange={(e) => {
              setPlatformFilter(e.target.value as ExternalDistributionPlatform | "");
              setPage(1);
            }}
          >
            <option value="">전체 플랫폼</option>
            <option value="kakaopage">카카오페이지</option>
            <option value="ridi">리디</option>
          </select>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Input
              className="w-[110px]"
              placeholder="작품 ID"
              value={newProductId}
              onChange={(e) => setNewProductId(e.target.value)}
            />
            <select
              aria-label="등록 플랫폼"
              className={selectClassName}
              value={newPlatform}
              onChange={(e) =>
                setNewPlatform(e.target.value as ExternalDistributionPlatform)
              }
            >
              <option value="kakaopage">카카오페이지</option>
              <option value="ridi">리디</option>
            </select>
            <Input
              className="w-[320px]"
              placeholder="외부 작품 URL 또는 작품 번호"
              value={newExternal}
              onChange={(e) => setNewExternal(e.target.value)}
            />
            <Button onClick={handleAdd}>수동 등록</Button>
          </div>
        </div>
        <CommonTable
          columns={columns}
          data={data?.results ?? []}
          loading={isLoading}
          emptyMessage="수집된 외부 유통 작품이 없습니다."
        />
        <PaginationControls
          page={page}
          setPage={setPage}
          totalPages={calculatePageCount(data?.total_count || 0, COUNT_PER_PAGE)}
        />
        <FullPageLoader isLoading={isBusy} />
      </div>
    </SidebarInset>
  );
}
