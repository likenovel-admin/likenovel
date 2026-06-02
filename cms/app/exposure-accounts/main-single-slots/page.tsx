"use client";

import {
  IMainSingleSlot,
  IMainSingleSlotProduct,
  IMainSingleSlotRequest,
} from "@/api/mainSingleSlot/dto";
import {
  useCancelMainSingleSlot,
  useCreateMainSingleSlot,
  useGetMainSingleSlots,
  usePublishMainSingleSlotNow,
  useSearchMainSingleSlotProducts,
  useUpdateMainSingleSlot,
} from "@/api/mainSingleSlot";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  calculatePageCount,
  catchErrorMessage,
  cn,
  confirm,
  showAlert,
} from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;
const OVERVIEW_PAGE_SIZE = 200;
const RESERVATION_BUFFER_MINUTES = 10;
type ExposureMode = "now" | "reservation";
type RequestBuildMode = "createSchedule" | "publishNow" | "update";
const SLOT_OPTIONS = [
  {
    key: "before_paid_top",
    name: "유료 Top 이전",
    order: 1,
  },
  {
    key: "between_direct_recommend_1",
    name: "직접 추천구좌 사이 1",
    order: 2,
  },
  {
    key: "between_direct_recommend_2",
    name: "직접 추천구좌 사이 2",
    order: 3,
  },
];

const ALL_SLOTS = "all";

function toDatetimeLocalValue(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function getMinReservationDate() {
  return new Date(Date.now() + RESERVATION_BUFFER_MINUTES * 60 * 1000);
}

function toApiDateTime(value: string) {
  return value ? `${value}:00+09:00` : "";
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return format(new Date(value), "yyyy-MM-dd HH:mm");
}

function toMaybeDatetimeLocalValue(value?: string | null) {
  if (!value) return "";
  return toDatetimeLocalValue(new Date(value));
}

function getCdnUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const raw = process.env.NEXT_PUBLIC_HOST_CDN_URL?.trim();
  const cdnBaseUrl = raw || "https://cdn.likenovel.net";
  if (path.startsWith("/")) return `${cdnBaseUrl}${path}`;
  return `${cdnBaseUrl}/${path}`;
}

function getSlotStatus(row: IMainSingleSlot) {
  if (row.cancelledAt) return "취소";

  const now = Date.now();
  const nowToleranceMs = 60 * 1000;
  const start = new Date(row.publishStartAt).getTime();
  const end = row.publishEndAt ? new Date(row.publishEndAt).getTime() : null;

  if (start > now + nowToleranceMs) return "예약";
  if (end && end <= now) return "종료";
  return "노출중";
}

function getStatusClassName(status: string) {
  if (status === "노출중") return "bg-green-100 text-green-700";
  if (status === "예약") return "bg-blue-100 text-blue-700";
  if (status === "종료") return "bg-gray-100 text-gray-600";
  return "bg-red-100 text-red-700";
}

function getOperationalRows(rows: IMainSingleSlot[]) {
  return rows.filter((row) => {
    const status = getSlotStatus(row);
    return status === "노출중" || status === "예약";
  });
}

function getActiveRowForSlot(rows: IMainSingleSlot[], slotKey: string) {
  return rows
    .filter((row) => row.slotKey === slotKey && getSlotStatus(row) === "노출중")
    .sort(
      (a, b) =>
        new Date(b.publishStartAt).getTime() -
          new Date(a.publishStartAt).getTime() ||
        b.singleSlotId - a.singleSlotId
    )[0];
}

function getNearestReservedRowForSlot(
  rows: IMainSingleSlot[],
  slotKey: string
) {
  const now = Date.now();
  return rows
    .filter((row) => {
      if (row.slotKey !== slotKey || getSlotStatus(row) !== "예약") return false;
      return new Date(row.publishStartAt).getTime() > now;
    })
    .sort(
      (a, b) =>
        new Date(a.publishStartAt).getTime() -
          new Date(b.publishStartAt).getTime() ||
        a.singleSlotId - b.singleSlotId
    )[0];
}

export default function Page() {
  const registerCardRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [slotKey, setSlotKey] = useState(SLOT_OPTIONS[0].key);
  const [slotFilter, setSlotFilter] = useState(ALL_SLOTS);
  const [searchInput, setSearchInput] = useState("");
  const [searchWord, setSearchWord] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<IMainSingleSlotProduct | null>(null);
  const [summaryText, setSummaryText] = useState("");
  const [exposureMode, setExposureMode] = useState<ExposureMode>("now");
  const [publishStartAt, setPublishStartAt] = useState("");
  const [publishEndAt, setPublishEndAt] = useState("");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [editingSlot, setEditingSlot] = useState<IMainSingleSlot | null>(null);

  const selectedSlot =
    SLOT_OPTIONS.find((option) => option.key === slotKey) || SLOT_OPTIONS[0];

  const {
    data: slots,
    refetch,
    isLoading: isLoadingSlots,
    isFetching: isFetchingSlots,
  } = useGetMainSingleSlots({
    page: includeHistory ? page : 1,
    count_per_page: PAGE_SIZE,
    slot_key: slotFilter === ALL_SLOTS ? undefined : slotFilter,
  });
  const {
    data: overviewSlots,
    refetch: refetchOverviewSlots,
    isLoading: isLoadingOverviewSlots,
    isFetching: isFetchingOverviewSlots,
  } = useGetMainSingleSlots({
    page: 1,
    count_per_page: OVERVIEW_PAGE_SIZE,
  });

  const {
    data: productSearchResult,
    isFetching: isSearchingProducts,
  } = useSearchMainSingleSlotProducts(
    { search_word: searchWord, limit: 20 },
    Boolean(searchWord.trim())
  );

  const createSlot = useCreateMainSingleSlot();
  const publishNow = usePublishMainSingleSlotNow();
  const updateSlot = useUpdateMainSingleSlot();
  const cancelSlot = useCancelMainSingleSlot();

  useEffect(() => {
    setPage(1);
  }, [slotFilter, includeHistory]);

  const isMutating =
    createSlot.isPending ||
    publishNow.isPending ||
    updateSlot.isPending ||
    cancelSlot.isPending;
  const minReservationValue = toDatetimeLocalValue(getMinReservationDate());
  const isReservationMode = exposureMode === "reservation";
  const editingSlotStatus = editingSlot ? getSlotStatus(editingSlot) : null;
  const shouldShowReservationFields =
    editingSlotStatus === "예약" || (!editingSlot && isReservationMode);
  const sourceRows = slots?.results ?? [];
  const displayRows = includeHistory ? sourceRows : getOperationalRows(sourceRows);
  const overviewRows = overviewSlots?.results ?? [];

  const resetForm = () => {
    setEditingSlot(null);
    setSelectedProduct(null);
    setSummaryText("");
    setExposureMode("now");
    setPublishStartAt("");
    setPublishEndAt("");
  };

  const handleExposureModeChange = (mode: ExposureMode) => {
    if (editingSlot) return;
    setExposureMode(mode);
    if (mode === "now") {
      setPublishStartAt("");
      setPublishEndAt("");
      return;
    }

    const minDate = getMinReservationDate();
    if (!publishStartAt || new Date(publishStartAt).getTime() < minDate.getTime()) {
      setPublishStartAt(toDatetimeLocalValue(minDate));
    }
  };

  const buildRequestBody = (mode: RequestBuildMode) => {
    if (!selectedProduct) {
      showAlert("오류", "작품을 선택해주세요.", "확인");
      return null;
    }
    if (!summaryText.trim()) {
      showAlert("오류", "소개글을 입력해주세요.", "확인");
      return null;
    }
    const isCreateSchedule = mode === "createSchedule";
    const isUpdate = mode === "update";
    const shouldIncludeSchedule = isCreateSchedule || isUpdate;

    if (isCreateSchedule && !isReservationMode) {
      showAlert("오류", "예약 노출 모드를 선택해주세요.", "확인");
      return null;
    }
    if (shouldIncludeSchedule && !publishStartAt) {
      showAlert("오류", "예약 공개일시를 입력해주세요.", "확인");
      return null;
    }
    if (
      isCreateSchedule &&
      new Date(publishStartAt).getTime() < getMinReservationDate().getTime()
    ) {
      showAlert(
        "오류",
        `예약 공개일시는 현재 시각 기준 ${RESERVATION_BUFFER_MINUTES}분 뒤부터 가능합니다.`,
        "확인"
      );
      return null;
    }
    if (
      shouldIncludeSchedule &&
      publishEndAt &&
      new Date(publishStartAt).getTime() >= new Date(publishEndAt).getTime()
    ) {
      showAlert("오류", "종료일시는 시작일시보다 뒤여야 합니다.", "확인");
      return null;
    }

    const body: IMainSingleSlotRequest = {
      slot_key: selectedSlot.key,
      slot_name: selectedSlot.name,
      slot_order: selectedSlot.order,
      product_id: selectedProduct.productId,
      summary_text: summaryText.trim(),
    };

    if (shouldIncludeSchedule) {
      body.publish_start_at = toApiDateTime(publishStartAt);
      body.publish_end_at = publishEndAt ? toApiDateTime(publishEndAt) : null;
    }

    return body;
  };

  const handleSearch = () => {
    const normalized = searchInput.trim();
    if (!normalized) {
      showAlert("오류", "검색어를 입력해주세요.", "확인");
      return;
    }
    setSearchWord(normalized);
  };

  const handleGoToAddForm = () => {
    const occupiedSlotKeys = new Set(
      overviewRows
        .filter((row) => {
          const status = getSlotStatus(row);
          return status === "노출중" || status === "예약";
        })
        .map((row) => row.slotKey)
    );
    const firstEmptySlot = SLOT_OPTIONS.find(
      (option) => !occupiedSlotKeys.has(option.key)
    );

    if (firstEmptySlot) {
      setSlotKey(firstEmptySlot.key);
    }
    setExposureMode("now");
    setEditingSlot(null);
    registerCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleEditSlot = (row: IMainSingleSlot) => {
    setEditingSlot(row);
    setSlotKey(row.slotKey);
    setSelectedProduct({
      productId: row.productId,
      title: row.productTitle,
      authorNickname: row.authorNickname,
      coverImagePath: null,
      openEpisodeCount: 0,
    });
    setSummaryText(row.summaryText);
    setPublishStartAt(toMaybeDatetimeLocalValue(row.publishStartAt));
    setPublishEndAt(toMaybeDatetimeLocalValue(row.publishEndAt));
    setExposureMode(getSlotStatus(row) === "예약" ? "reservation" : "now");
    registerCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleCreateSchedule = async () => {
    if (createSlot.isPending) return;
    const body = buildRequestBody("createSchedule");
    if (!body) return;

    createSlot.mutate(body, {
      onSuccess: () => {
        showAlert("완료", "단일구좌 예약을 등록했습니다.", "확인");
        resetForm();
        refetch();
        refetchOverviewSlots();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handlePublishNow = async () => {
    if (publishNow.isPending) return;
    const body = buildRequestBody("publishNow");
    if (!body) return;

    const result = await confirm({
      title: "바로 노출하시겠습니까?",
      text: `현재 ${selectedSlot.name} 단일구좌가 즉시 교체됩니다.`,
      confirm: "지금 교체",
      cancel: "취소",
    });
    if (!result.isConfirmed) return;

    publishNow.mutate(body, {
      onSuccess: () => {
        showAlert("완료", "단일구좌를 바로 노출했습니다.", "확인");
        resetForm();
        refetch();
        refetchOverviewSlots();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handleUpdateSlot = async () => {
    if (!editingSlot || updateSlot.isPending) return;
    const body = buildRequestBody("update");
    if (!body) return;

    updateSlot.mutate(
      { singleSlotId: editingSlot.singleSlotId, body },
      {
        onSuccess: () => {
          showAlert("완료", "단일구좌를 수정했습니다.", "확인");
          resetForm();
          refetch();
          refetchOverviewSlots();
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  const handleCancel = async (row: IMainSingleSlot) => {
    if (cancelSlot.isPending) return;
    const result = await confirm({
      title: "단일구좌를 삭제하시겠습니까?",
      text: "삭제 후에는 해당 큐가 노출되지 않습니다.",
      confirm: "삭제",
      cancel: "닫기",
    });
    if (!result.isConfirmed) return;

    cancelSlot.mutate(row.singleSlotId, {
      onSuccess: () => {
        refetch();
        refetchOverviewSlots();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="" />
      <div className="flex flex-1 flex-col gap-4 p-5 pt-0">
        <div>
          <h1 className="text-2xl font-semibold">단일구좌 관리</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            메인 페이지 구좌 사이에 노출할 작품 1개를 예약하거나 즉시 교체합니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>현재 노출 상태</CardTitle>
                <CardDescription>
                  각 위치에 현재 보이는 작품과 가장 가까운 예약을 확인합니다.
                </CardDescription>
              </div>
              <Button
                variant="default"
                onClick={handleGoToAddForm}
                disabled={
                  SLOT_OPTIONS.every((option) =>
                    overviewRows.some((row) => {
                      const status = getSlotStatus(row);
                      return (
                        row.slotKey === option.key &&
                        (status === "노출중" || status === "예약")
                      );
                    })
                  ) ||
                  isLoadingOverviewSlots ||
                  isFetchingOverviewSlots
                }
              >
                추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingOverviewSlots || isFetchingOverviewSlots ? (
              <div className="h-24 rounded-md border p-4 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {SLOT_OPTIONS.map((option) => {
                  const activeRow = getActiveRowForSlot(
                    overviewRows,
                    option.key
                  );
                  const nextReservedRow = getNearestReservedRowForSlot(
                    overviewRows,
                    option.key
                  );

                  return (
                    <div
                      key={option.key}
                      className="rounded-md bg-muted/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">
                            {option.name}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            슬롯 {option.order} · 항목 클릭 시 수정
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                            activeRow
                              ? getStatusClassName("노출중")
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          현재
                        </span>
                        {activeRow ? (
                          <div className="mt-2 space-y-2">
                            <div
                              className="flex cursor-pointer items-start justify-between gap-2 rounded-md p-2 hover:bg-background"
                              onClick={() => handleEditSlot(activeRow)}
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">
                                  {activeRow.productTitle}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {activeRow.authorNickname} · 시작{" "}
                                  {formatDateTime(activeRow.publishStartAt)}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancel(activeRow);
                                }}
                              >
                                삭제
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-muted-foreground">
                            현재 노출 없음
                          </div>
                        )}
                      </div>

                      <div className="mt-4 border-t pt-3">
                        <div className="text-xs font-medium text-muted-foreground">
                          다음 예약
                        </div>
                        {nextReservedRow ? (
                          <div className="mt-1 space-y-2">
                            <div
                              className="flex cursor-pointer items-start justify-between gap-2 rounded-md p-2 hover:bg-background"
                              onClick={() => handleEditSlot(nextReservedRow)}
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">
                                  {nextReservedRow.productTitle}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDateTime(nextReservedRow.publishStartAt)}
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancel(nextReservedRow);
                                }}
                              >
                                삭제
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1 text-sm text-muted-foreground">
                            예약 없음
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card ref={registerCardRef}>
          <CardHeader>
            <CardTitle>
              {editingSlot ? "단일구좌 수정" : "단일구좌 등록"}
            </CardTitle>
            <CardDescription>
              {editingSlot
                ? "선택한 단일구좌의 작품과 소개글을 수정합니다."
                : "공개 회차가 있는 공개 작품만 검색됩니다. 종료일시를 비우면 항시 노출됩니다."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <label className="text-sm font-medium">노출 방식</label>
              {editingSlot ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                      getStatusClassName(editingSlotStatus || "")
                    )}
                  >
                    {editingSlotStatus}
                  </span>
                  <span>수정 시 기존 노출 상태를 유지합니다.</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant={exposureMode === "now" ? "default" : "outline"}
                    onClick={() => handleExposureModeChange("now")}
                  >
                    바로 노출
                  </Button>
                  <Button
                    variant={
                      exposureMode === "reservation" ? "default" : "outline"
                    }
                    onClick={() => handleExposureModeChange("reservation")}
                  >
                    예약 노출
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <label className="text-sm font-medium require">노출 위치</label>
              <Select
                value={slotKey}
                onValueChange={setSlotKey}
                disabled={Boolean(editingSlot)}
              >
                <SelectTrigger className="w-[320px]">
                  <SelectValue placeholder="노출 위치 선택" />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_OPTIONS.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4">
              <label className="pt-2 text-sm font-medium require">작품 검색</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    placeholder="작품명을 입력하세요"
                    className="max-w-[520px]"
                  />
                  <Button variant="outline" onClick={handleSearch}>
                    검색
                  </Button>
                </div>

                {selectedProduct && (
                  <div className="flex w-fit items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <span className="font-medium">선택됨</span>
                    <span>
                      {selectedProduct.title} · {selectedProduct.authorNickname} ·{" "}
                      {selectedProduct.openEpisodeCount > 0
                        ? `${selectedProduct.openEpisodeCount}화`
                        : "기존 선택"}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProduct(null)}
                    >
                      해제
                    </Button>
                  </div>
                )}

                <div className="max-h-[260px] overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[72px]">표지</TableHead>
                        <TableHead>작품명</TableHead>
                        <TableHead>작가</TableHead>
                        <TableHead>공개회차</TableHead>
                        <TableHead className="w-[90px]">선택</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isSearchingProducts ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-20 text-center">
                            검색 중...
                          </TableCell>
                        </TableRow>
                      ) : productSearchResult?.data?.length ? (
                        productSearchResult.data.map((product) => (
                          <TableRow
                            key={product.productId}
                            className={cn(
                              selectedProduct?.productId === product.productId &&
                                "bg-muted"
                            )}
                          >
                            <TableCell>
                              {product.coverImagePath ? (
                                <img
                                  src={getCdnUrl(product.coverImagePath)}
                                  alt={product.title}
                                  className="h-16 w-12 rounded object-cover"
                                />
                              ) : (
                                <div className="flex h-16 w-12 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                                  없음
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              {product.title}
                            </TableCell>
                            <TableCell>{product.authorNickname}</TableCell>
                            <TableCell>{product.openEpisodeCount}화</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProduct(product)}
                              >
                                선택
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-20 text-center text-muted-foreground"
                          >
                            작품명을 검색하세요.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-4">
              <label className="pt-2 text-sm font-medium require">소개글</label>
              <Textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder={"구좌에 노출할 소개글을 입력하세요.\n줄바꿈은 그대로 저장됩니다."}
                className="min-h-[110px] max-w-[720px]"
                maxLength={500}
              />
            </div>

            {shouldShowReservationFields && (
              <div className="grid grid-cols-[180px_1fr] items-center gap-4">
                <label className="text-sm font-medium require">예약 공개</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    value={publishStartAt}
                    onChange={(e) => setPublishStartAt(e.target.value)}
                    min={minReservationValue}
                    className="w-[220px]"
                  />
                  <span className="text-muted-foreground">~</span>
                  <Input
                    type="datetime-local"
                    value={publishEndAt}
                    onChange={(e) => setPublishEndAt(e.target.value)}
                    min={publishStartAt || minReservationValue}
                    className="w-[220px]"
                  />
                  <span className="text-sm text-muted-foreground">
                    현재 시각 기준 {RESERVATION_BUFFER_MINUTES}분 뒤부터 가능 ·
                    종료일시 미입력 시 항시
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                {editingSlot ? "수정 취소" : "초기화"}
              </Button>
              {editingSlot ? (
                <Button onClick={handleUpdateSlot}>수정 저장</Button>
              ) : isReservationMode ? (
                <Button onClick={handleCreateSchedule}>예약 등록</Button>
              ) : (
                <Button onClick={handlePublishNow}>지금 교체</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>단일구좌 큐 리스트</CardTitle>
            <CardDescription>
              운영중/예약 항목을 우선 확인하고, 필요할 때 취소/종료 이력을 함께 봅니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded-md border bg-muted p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={!includeHistory ? "default" : "ghost"}
                  onClick={() => setIncludeHistory(false)}
                >
                  운영중/예약
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={includeHistory ? "default" : "ghost"}
                  onClick={() => setIncludeHistory(true)}
                >
                  취소/종료 포함
                </Button>
              </div>
              <Select value={slotFilter} onValueChange={setSlotFilter}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="노출 위치 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SLOTS}>전체 위치</SelectItem>
                  {SLOT_OPTIONS.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">상태</TableHead>
                    <TableHead>노출 위치</TableHead>
                    <TableHead>작품</TableHead>
                    <TableHead>작가</TableHead>
                    <TableHead>소개글</TableHead>
                    <TableHead>시작</TableHead>
                    <TableHead>종료</TableHead>
                    <TableHead className="w-[90px]">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSlots || isFetchingSlots ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : displayRows.length ? (
                    displayRows.map((row) => {
                      const status = getSlotStatus(row);
                      return (
                        <TableRow key={row.singleSlotId}>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-1 text-xs font-medium",
                                getStatusClassName(status)
                              )}
                            >
                              {status}
                            </span>
                          </TableCell>
                          <TableCell>{row.slotName}</TableCell>
                          <TableCell className="font-medium">
                            {row.productTitle}
                          </TableCell>
                          <TableCell>{row.authorNickname}</TableCell>
                          <TableCell className="max-w-[260px] whitespace-pre-line">
                            {row.summaryText}
                          </TableCell>
                          <TableCell>{formatDateTime(row.publishStartAt)}</TableCell>
                          <TableCell>
                            {row.publishEndAt
                              ? formatDateTime(row.publishEndAt)
                              : "항시"}
                          </TableCell>
                          <TableCell>
                            {row.cancelledAt ? (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(row)}
                              >
                                취소
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {sourceRows.length && !includeHistory
                          ? "표시할 운영중/예약 큐가 없습니다. 취소/종료 포함을 누르면 이력을 볼 수 있습니다."
                          : "등록된 단일구좌가 없습니다."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {includeHistory && (
              <PaginationControls
                page={page}
                setPage={setPage}
                totalPages={calculatePageCount(slots?.total_count || 0, PAGE_SIZE)}
              />
            )}
          </CardContent>
        </Card>
      </div>
      <FullPageLoader isLoading={isMutating} />
    </SidebarInset>
  );
}
