"use client";

import {
  IMainCharacterSlot,
  IMainCharacterSlotProduct,
  IMainCharacterSlotRequest,
} from "@/api/mainCharacterSlot/dto";
import {
  useCancelMainCharacterSlot,
  useCreateMainCharacterSlot,
  useGetCharacterRoster,
  useGetMainCharacterSlots,
  usePublishMainCharacterSlotNow,
  useSearchMainCharacterSlotProducts,
  useUpdateMainCharacterSlot,
} from "@/api/mainCharacterSlot";
import { useCreateUpload, useUpdateUpload } from "@/api/upload";
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

function getSlotStatus(row: IMainCharacterSlot) {
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

function getOperationalRows(rows: IMainCharacterSlot[]) {
  return rows.filter((row) => {
    const status = getSlotStatus(row);
    return status === "노출중" || status === "예약";
  });
}

export default function Page() {
  const registerCardRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchWord, setSearchWord] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<IMainCharacterSlotProduct | null>(null);
  const [selectedScopeKey, setSelectedScopeKey] = useState("");
  const [selectedDisplayName, setSelectedDisplayName] = useState("");
  const [characterImageFileId, setCharacterImageFileId] = useState<number | null>(
    null
  );
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [cardOrder, setCardOrder] = useState(1);
  const [exposureMode, setExposureMode] = useState<ExposureMode>("now");
  const [publishStartAt, setPublishStartAt] = useState("");
  const [publishEndAt, setPublishEndAt] = useState("");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [editingSlot, setEditingSlot] = useState<IMainCharacterSlot | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    data: slots,
    refetch,
    isLoading: isLoadingSlots,
    isFetching: isFetchingSlots,
  } = useGetMainCharacterSlots({
    page: includeHistory ? page : 1,
    count_per_page: PAGE_SIZE,
  });
  const {
    data: overviewSlots,
    refetch: refetchOverviewSlots,
    isLoading: isLoadingOverviewSlots,
    isFetching: isFetchingOverviewSlots,
  } = useGetMainCharacterSlots({
    page: 1,
    count_per_page: OVERVIEW_PAGE_SIZE,
  });

  const { data: productSearchResult, isFetching: isSearchingProducts } =
    useSearchMainCharacterSlotProducts(
      { search_word: searchWord, limit: 20 },
      Boolean(searchWord.trim())
    );

  const { data: rosterResult, isFetching: isFetchingRoster } = useGetCharacterRoster(
    selectedProduct?.productId ?? null,
    Boolean(selectedProduct)
  );

  const createSlot = useCreateMainCharacterSlot();
  const publishNow = usePublishMainCharacterSlotNow();
  const updateSlot = useUpdateMainCharacterSlot();
  const cancelSlot = useCancelMainCharacterSlot();
  const createUpload = useCreateUpload();
  const updateUpload = useUpdateUpload();

  useEffect(() => {
    setPage(1);
  }, [includeHistory]);

  const isMutating =
    createSlot.isPending ||
    publishNow.isPending ||
    updateSlot.isPending ||
    cancelSlot.isPending ||
    isUploading;
  const minReservationValue = toDatetimeLocalValue(getMinReservationDate());
  const isReservationMode = exposureMode === "reservation";
  const editingSlotStatus = editingSlot ? getSlotStatus(editingSlot) : null;
  const shouldShowReservationFields =
    editingSlotStatus === "예약" || (!editingSlot && isReservationMode);
  const sourceRows = slots?.results ?? [];
  const displayRows = includeHistory ? sourceRows : getOperationalRows(sourceRows);
  const overviewRows = overviewSlots?.results ?? [];
  const activeCards = getOperationalRows(overviewRows)
    .filter((row) => getSlotStatus(row) === "노출중")
    .sort((a, b) => a.cardOrder - b.cardOrder || a.characterSlotId - b.characterSlotId);
  const rosterCharacters = rosterResult?.data ?? [];

  const resetForm = () => {
    setEditingSlot(null);
    setSelectedProduct(null);
    setSelectedScopeKey("");
    setSelectedDisplayName("");
    setCharacterImageFileId(null);
    setImagePreviewUrl(null);
    setCardOrder(1);
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

  const handleSearch = () => {
    const normalized = searchInput.trim();
    if (!normalized) {
      showAlert("오류", "검색어를 입력해주세요.", "확인");
      return;
    }
    setSearchWord(normalized);
  };

  const handleSelectProduct = (product: IMainCharacterSlotProduct) => {
    setSelectedProduct(product);
    // 작품이 바뀌면 캐릭터 선택을 초기화한다(로스터가 작품별로 다름).
    setSelectedScopeKey("");
    setSelectedDisplayName("");
  };

  const handleSelectCharacter = (scopeKey: string) => {
    setSelectedScopeKey(scopeKey);
    const matched = rosterCharacters.find((c) => c.scopeKey === scopeKey);
    setSelectedDisplayName(matched?.displayName ?? "");
  };

  const handleImageChange = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showAlert("오류", "이미지 파일만 업로드할 수 있습니다.", "확인");
      return;
    }
    setIsUploading(true);
    try {
      const created = await createUpload.mutateAsync({
        group_type: "character",
        file_name: file.name,
      });
      await updateUpload.mutateAsync({
        url: created.data.uploadPath,
        file,
        file_type: file.type,
      });
      setCharacterImageFileId(created.data.fileId);
      setImagePreviewUrl(URL.createObjectURL(file));
    } catch (err: any) {
      showAlert("오류", catchErrorMessage(err), "확인");
    } finally {
      setIsUploading(false);
    }
  };

  const buildRequestBody = (mode: RequestBuildMode): IMainCharacterSlotRequest | null => {
    if (!selectedProduct) {
      showAlert("오류", "작품을 선택해주세요.", "확인");
      return null;
    }
    if (!selectedScopeKey) {
      showAlert("오류", "캐릭터를 선택해주세요.", "확인");
      return null;
    }
    if (!characterImageFileId) {
      showAlert("오류", "캐릭터 이미지를 업로드해주세요.", "확인");
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

    const body: IMainCharacterSlotRequest = {
      product_id: selectedProduct.productId,
      character_scope_key: selectedScopeKey,
      character_name: selectedDisplayName,
      character_image_file_id: characterImageFileId,
      card_order: cardOrder,
    };

    if (shouldIncludeSchedule) {
      body.publish_start_at = toApiDateTime(publishStartAt);
      body.publish_end_at = publishEndAt ? toApiDateTime(publishEndAt) : null;
    }

    return body;
  };

  const handleGoToAddForm = () => {
    resetForm();
    registerCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleEditSlot = (row: IMainCharacterSlot) => {
    setEditingSlot(row);
    setSelectedProduct({
      productId: row.productId,
      title: row.productTitle,
      authorNickname: row.authorNickname,
      coverImagePath: null,
      openEpisodeCount: 0,
    });
    setSelectedScopeKey(row.characterScopeKey);
    setSelectedDisplayName(row.characterName);
    setCharacterImageFileId(row.characterImageFileId);
    setImagePreviewUrl(getCdnUrl(row.characterImagePath) || null);
    setCardOrder(row.cardOrder);
    setPublishStartAt(toMaybeDatetimeLocalValue(row.publishStartAt));
    setPublishEndAt(toMaybeDatetimeLocalValue(row.publishEndAt));
    setExposureMode(getSlotStatus(row) === "예약" ? "reservation" : "now");
    registerCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCreateSchedule = async () => {
    if (createSlot.isPending) return;
    const body = buildRequestBody("createSchedule");
    if (!body) return;
    createSlot.mutate(body, {
      onSuccess: () => {
        showAlert("완료", "캐릭터 카드 예약을 등록했습니다.", "확인");
        resetForm();
        refetch();
        refetchOverviewSlots();
      },
      onError: (err: any) => showAlert("오류", catchErrorMessage(err), "확인"),
    });
  };

  const handlePublishNow = async () => {
    if (publishNow.isPending) return;
    const body = buildRequestBody("publishNow");
    if (!body) return;
    const result = await confirm({
      title: "바로 노출하시겠습니까?",
      text: "캐릭터 카드가 즉시 캐러셀에 추가됩니다.",
      confirm: "지금 노출",
      cancel: "취소",
    });
    if (!result.isConfirmed) return;
    publishNow.mutate(body, {
      onSuccess: () => {
        showAlert("완료", "캐릭터 카드를 바로 노출했습니다.", "확인");
        resetForm();
        refetch();
        refetchOverviewSlots();
      },
      onError: (err: any) => showAlert("오류", catchErrorMessage(err), "확인"),
    });
  };

  const handleUpdateSlot = async () => {
    if (!editingSlot || updateSlot.isPending) return;
    const body = buildRequestBody("update");
    if (!body) return;
    updateSlot.mutate(
      { characterSlotId: editingSlot.characterSlotId, body },
      {
        onSuccess: () => {
          showAlert("완료", "캐릭터 카드를 수정했습니다.", "확인");
          resetForm();
          refetch();
          refetchOverviewSlots();
        },
        onError: (err: any) => showAlert("오류", catchErrorMessage(err), "확인"),
      }
    );
  };

  const handleCancel = async (row: IMainCharacterSlot) => {
    if (cancelSlot.isPending) return;
    const result = await confirm({
      title: "캐릭터 카드를 삭제하시겠습니까?",
      text: "삭제 후에는 해당 카드가 노출되지 않습니다.",
      confirm: "삭제",
      cancel: "닫기",
    });
    if (!result.isConfirmed) return;
    cancelSlot.mutate(row.characterSlotId, {
      onSuccess: () => {
        refetch();
        refetchOverviewSlots();
      },
      onError: (err: any) => showAlert("오류", catchErrorMessage(err), "확인"),
    });
  };

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="" />
      <div className="flex flex-1 flex-col gap-4 p-5 pt-0">
        <div>
          <h1 className="text-2xl font-semibold">캐릭터 구좌 관리</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            메인 상단 캐릭터 캐러셀에 노출할 카드(작품 + 캐릭터 + 이미지)를 등록·예약합니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>현재 캐러셀</CardTitle>
                <CardDescription>
                  현재 노출 중인 카드를 순서대로 보여줍니다. 카드를 클릭하면 수정합니다.
                </CardDescription>
              </div>
              <Button variant="default" onClick={handleGoToAddForm}>
                추가
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingOverviewSlots || isFetchingOverviewSlots ? (
              <div className="h-24 rounded-md border p-4 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : activeCards.length === 0 ? (
              <div className="h-24 rounded-md border p-4 text-sm text-muted-foreground flex items-center">
                현재 노출 중인 캐릭터 카드가 없습니다.
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {activeCards.map((row) => (
                  <button
                    key={row.characterSlotId}
                    type="button"
                    onClick={() => handleEditSlot(row)}
                    className="group w-[120px] text-left"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md border bg-muted">
                      {row.characterImagePath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getCdnUrl(row.characterImagePath)}
                          alt={row.characterName}
                          className="h-full w-full object-cover transition group-hover:opacity-80"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          이미지 없음
                        </div>
                      )}
                      <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                        #{row.cardOrder}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-sm font-medium">
                      {row.characterName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {row.productTitle}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card ref={registerCardRef}>
          <CardHeader>
            <CardTitle>{editingSlot ? "캐릭터 카드 수정" : "캐릭터 카드 등록"}</CardTitle>
            <CardDescription>
              {editingSlot
                ? "선택한 카드의 캐릭터/이미지/순서를 수정합니다."
                : "공개 회차가 있는 공개 작품만 검색됩니다. 캐릭터는 웹소챗 컨텍스트가 빌드된 작품에서만 선택할 수 있습니다."}
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
                    variant={exposureMode === "reservation" ? "default" : "outline"}
                    onClick={() => handleExposureModeChange("reservation")}
                  >
                    예약 노출
                  </Button>
                </div>
              )}
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
                      {selectedProduct.title} · {selectedProduct.authorNickname}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(null);
                        setSelectedScopeKey("");
                        setSelectedDisplayName("");
                      }}
                    >
                      해제
                    </Button>
                  </div>
                )}

                <div className="max-h-[220px] overflow-auto rounded-md border">
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
                                // eslint-disable-next-line @next/next/no-img-element
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
                                onClick={() => handleSelectProduct(product)}
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

            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <label className="text-sm font-medium require">캐릭터</label>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedScopeKey}
                  onValueChange={handleSelectCharacter}
                  disabled={!selectedProduct || isFetchingRoster}
                >
                  <SelectTrigger className="w-[320px]">
                    <SelectValue
                      placeholder={
                        !selectedProduct
                          ? "작품을 먼저 선택하세요"
                          : isFetchingRoster
                          ? "캐릭터 불러오는 중..."
                          : rosterCharacters.length === 0
                          ? "이 작품은 선택 가능한 캐릭터가 없습니다"
                          : "캐릭터 선택"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {rosterCharacters.map((c) => (
                      <SelectItem key={c.scopeKey} value={c.scopeKey}>
                        {c.displayName}
                        {c.aliases?.length ? (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({c.aliases.slice(0, 2).join(", ")})
                          </span>
                        ) : null}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct &&
                  !isFetchingRoster &&
                  rosterCharacters.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      웹소챗 컨텍스트가 아직 빌드되지 않은 작품입니다.
                    </span>
                  )}
              </div>
            </div>

            <div className="grid grid-cols-[180px_1fr] items-start gap-4">
              <label className="pt-2 text-sm font-medium require">캐릭터 이미지</label>
              <div className="flex items-start gap-4">
                <div className="relative h-[160px] w-[120px] overflow-hidden rounded-md border bg-muted">
                  {imagePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreviewUrl}
                      alt="캐릭터 미리보기"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      미리보기
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="max-w-[320px]"
                    onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    세로형(3:4 권장) 캐릭터 이미지를 업로드하세요.
                    {isUploading && " · 업로드 중..."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[180px_1fr] items-center gap-4">
              <label className="text-sm font-medium">카드 순서</label>
              <Input
                type="number"
                min={1}
                value={cardOrder}
                onChange={(e) => setCardOrder(Math.max(1, Number(e.target.value) || 1))}
                className="w-[120px]"
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
                    현재 시각 기준 {RESERVATION_BUFFER_MINUTES}분 뒤부터 가능 · 종료일시
                    미입력 시 항시
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
                <Button onClick={handlePublishNow}>지금 노출</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>캐릭터 카드 리스트</CardTitle>
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
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">상태</TableHead>
                    <TableHead className="w-[64px]">이미지</TableHead>
                    <TableHead>캐릭터</TableHead>
                    <TableHead>작품</TableHead>
                    <TableHead className="w-[64px]">순서</TableHead>
                    <TableHead>시작</TableHead>
                    <TableHead>종료</TableHead>
                    <TableHead className="w-[120px]">관리</TableHead>
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
                        <TableRow key={row.characterSlotId}>
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
                          <TableCell>
                            {row.characterImagePath ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={getCdnUrl(row.characterImagePath)}
                                alt={row.characterName}
                                className="h-14 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-14 w-10 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
                                없음
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.characterName}
                          </TableCell>
                          <TableCell>{row.productTitle}</TableCell>
                          <TableCell>{row.cardOrder}</TableCell>
                          <TableCell>{formatDateTime(row.publishStartAt)}</TableCell>
                          <TableCell>
                            {row.publishEndAt
                              ? formatDateTime(row.publishEndAt)
                              : "항시"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSlot(row)}
                              >
                                수정
                              </Button>
                              {!row.cancelledAt && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => handleCancel(row)}
                                >
                                  취소
                                </Button>
                              )}
                            </div>
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
                          ? "표시할 운영중/예약 카드가 없습니다. 취소/종료 포함을 누르면 이력을 볼 수 있습니다."
                          : "등록된 캐릭터 카드가 없습니다."}
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
