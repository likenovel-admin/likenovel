"use client";

import {
  useCreateMainCharacterSlot,
  useDeleteMainCharacterSlot,
  useGetMainCharacterSlotConfig,
  useGetMainCharacterSlotProducts,
  useGetMainCharacterSlotRoster,
  useGetMainCharacterSlots,
  usePublishMainCharacterSlotNow,
  useUpdateMainCharacterSlotConfig,
  useUpdateMainCharacterSlot,
} from "@/api/mainCharacterSlot";
import {
  IMainCharacterSlot,
  IMainCharacterSlotProduct,
  IMainCharacterSlotRequest,
  MainCharacterSlotDisplayMode,
} from "@/api/mainCharacterSlot/dto";
import { useCreateUpload, useUpdateUpload } from "@/api/upload";
import CharacterImageCropDialog from "./CharacterImageCropDialog";
import { FileUpload } from "@/components/common/FileUpload";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CHARACTER_IMAGE_HEIGHT,
  CHARACTER_IMAGE_WIDTH,
  isSupportedCharacterImageFile,
  prepareCharacterImageFromCover,
} from "@/lib/imageOptimize";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { format } from "date-fns";
import { Check, Crop, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const PAGE_SIZE = 200;
const PRODUCT_PAGE_SIZE = 20;
const CHAT_QUALITY = {
  good: {
    label: "양호",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    description: "상위 캐릭터의 회차·RP 예시·장면 데이터가 충분합니다.",
  },
  normal: {
    label: "보통",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    description: "채팅은 가능하지만 일부 캐릭터의 대화 재료가 적습니다.",
  },
  insufficient: {
    label: "부족",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    description: "선택 가능한 캐릭터 중 장면 데이터가 없는 인물이 있습니다.",
  },
} as const;

const toApiDateTime = (value: string) => (value ? `${value}:00+09:00` : "");

const toInputDateTime = (value?: string | null) =>
  value ? format(new Date(value), "yyyy-MM-dd'T'HH:mm") : "";

const formatDateTime = (value?: string | null) =>
  value ? format(new Date(value), "yyyy-MM-dd HH:mm") : "-";

const getCdnUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_HOST_CDN_URL?.trim() || "https://cdn.likenovel.net";
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
};

const getSlotStatus = (row: IMainCharacterSlot) => {
  const now = Date.now();
  const start = new Date(row.publishStartAt).getTime();
  const end = row.publishEndAt ? new Date(row.publishEndAt).getTime() : null;
  if (start > now) return "예약";
  if (end && end <= now) return "종료";
  return "노출중";
};

export default function Page() {
  const [activeTab, setActiveTab] =
    useState<"main" | "catalog" | "candidates">("main");
  const [productPage, setProductPage] = useState(1);
  const [productSearchInput, setProductSearchInput] = useState("");
  const [productSearchWord, setProductSearchWord] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<IMainCharacterSlotProduct | null>(null);
  const [characterScopeKey, setCharacterScopeKey] = useState("");
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [characterImagePreviewUrl, setCharacterImagePreviewUrl] = useState("");
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cardOrder, setCardOrder] = useState("1");
  const [publishStartAt, setPublishStartAt] = useState("");
  const [publishEndAt, setPublishEndAt] = useState("");
  const [editingSlot, setEditingSlot] = useState<IMainCharacterSlot | null>(null);

  const { data, isLoading, refetch } = useGetMainCharacterSlots({
    page: 1,
    count_per_page: PAGE_SIZE,
  });
  const {
    data: configData,
    isLoading: isLoadingConfig,
    isFetching: isFetchingConfig,
    isError: isConfigError,
    refetch: refetchConfig,
  } = useGetMainCharacterSlotConfig();
  const { data: productListData, isFetching: isLoadingProducts } =
    useGetMainCharacterSlotProducts({
      page: productPage,
      count_per_page: PRODUCT_PAGE_SIZE,
      search_word: productSearchWord,
    });
  const { data: rosterData, isFetching: isLoadingRoster } =
    useGetMainCharacterSlotRoster(selectedProduct?.productId ?? null);
  const createSlot = useCreateMainCharacterSlot();
  const publishNow = usePublishMainCharacterSlotNow();
  const updateSlot = useUpdateMainCharacterSlot();
  const updateDisplayMode = useUpdateMainCharacterSlotConfig();
  const deleteSlot = useDeleteMainCharacterSlot();
  const createUpload = useCreateUpload();
  const updateUpload = useUpdateUpload();

  const rows = data?.results ?? [];
  const displayMode = configData?.data.displayMode;
  const publiclyEligibleRows = rows.filter(
    (row) => row.publicEligible && getSlotStatus(row) === "노출중"
  );
  const mainRows = publiclyEligibleRows.slice(0, 12);
  const reviewRows = rows.filter(
    (row) => !row.publicEligible || getSlotStatus(row) !== "노출중"
  );
  const visibleRows =
    activeTab === "main"
      ? mainRows
      : activeTab === "catalog"
        ? publiclyEligibleRows
        : reviewRows;
  const roster = rosterData?.data ?? [];
  const selectedCharacter = roster.find(
    (item) => item.scopeKey === characterScopeKey
  );
  const productResults = productListData?.results ?? [];
  const productTotalPages = Math.max(
    1,
    Math.ceil((productListData?.total_count ?? 0) / PRODUCT_PAGE_SIZE)
  );
  const isSaving =
    createSlot.isPending ||
    publishNow.isPending ||
    updateSlot.isPending ||
    createUpload.isPending ||
    updateUpload.isPending;
  const currentCharacterImageUrl = getCdnUrl(editingSlot?.characterImagePath);
  const fallbackCharacterImageUrl = getCdnUrl(selectedProduct?.coverImagePath);
  const characterImagePreview =
    characterImagePreviewUrl ||
    currentCharacterImageUrl ||
    fallbackCharacterImageUrl;

  useEffect(() => {
    if (!characterImage) {
      setCharacterImagePreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(characterImage);
    setCharacterImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [characterImage]);

  const resetForm = () => {
    setSelectedProduct(null);
    setCharacterScopeKey("");
    setCharacterImage(null);
    setCropSourceFile(null);
    setIsCropOpen(false);
    setCardOrder("1");
    setPublishStartAt("");
    setPublishEndAt("");
    setEditingSlot(null);
  };

  const selectProduct = (product: IMainCharacterSlotProduct) => {
    setSelectedProduct(product);
    setCharacterScopeKey("");
  };

  const searchProducts = () => {
    setProductSearchWord(productSearchInput.trim());
    setProductPage(1);
  };

  const handleCharacterImageChange = (file: File | null) => {
    if (file && !isSupportedCharacterImageFile(file)) {
      showAlert("오류", "JPG, PNG, WebP 이미지만 사용할 수 있습니다.", "확인");
      return;
    }
    setCharacterImage(file);
  };

  const openCropDialog = async () => {
    if (characterImage) {
      setCropSourceFile(characterImage);
      setIsCropOpen(true);
      return;
    }
    if (!characterImagePreview) return;

    try {
      const response = await fetch(characterImagePreview, {
        credentials: "omit",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`이미지 응답 오류: ${response.status}`);
      }
      const blob = await response.blob();
      const file = new File(
        [blob],
        `character-${editingSlot?.productId ?? selectedProduct?.productId ?? "image"}`,
        { type: blob.type },
      );
      if (!isSupportedCharacterImageFile(file)) {
        throw new Error("JPG, PNG, WebP 이미지만 사용할 수 있습니다.");
      }
      setCropSourceFile(file);
      setIsCropOpen(true);
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  const handleEdit = (row: IMainCharacterSlot) => {
    setActiveTab("candidates");
    setEditingSlot(row);
    setSelectedProduct({
      productId: row.productId,
      title: row.productTitle,
      authorNickname: row.authorNickname,
      coverImagePath: null,
      openEpisodeCount: 0,
      chatQuality: "normal",
    });
    setCharacterScopeKey(row.characterScopeKey);
    setCharacterImage(null);
    setCardOrder(String(row.cardOrder));
    setPublishStartAt(toInputDateTime(row.publishStartAt));
    setPublishEndAt(toInputDateTime(row.publishEndAt));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadCharacterImage = async (
    product: IMainCharacterSlotProduct,
  ) => {
    if (!characterImage && editingSlot) return undefined;

    const uploadableImage = characterImage
      ? {
          file: characterImage,
          fileName: characterImage.name,
          contentType: characterImage.type || "application/octet-stream",
        }
      : await prepareCharacterImageFromCover(
          getCdnUrl(product.coverImagePath),
          product.productId,
        );
    const upload = await createUpload.mutateAsync({
      group_type: "character",
      file_name: uploadableImage.fileName,
    });
    await updateUpload.mutateAsync({
      url: upload.data.uploadPath,
      file: uploadableImage.file,
      file_type: uploadableImage.contentType,
    });
    return upload.data.fileId;
  };

  const buildRequest = async (requireStart: boolean) => {
    if (!selectedProduct || !characterScopeKey) {
      showAlert("오류", "작품과 주인공을 선택해 주세요.", "확인");
      return null;
    }
    if (selectedCharacter?.chatQuality === "insufficient") {
      showAlert(
        "공개 불가",
        selectedCharacter.qualityReason || "공개에 필요한 캐릭터 데이터가 부족합니다.",
        "확인"
      );
      return null;
    }
    if (!selectedCharacter) {
      showAlert(
        "확인 필요",
        "캐릭터 품질 정보를 불러온 뒤 다시 시도해 주세요.",
        "확인"
      );
      return null;
    }
    const order = Number(cardOrder);
    if (!Number.isInteger(order) || order < 1) {
      showAlert("오류", "카드 순서는 1 이상의 정수여야 합니다.", "확인");
      return null;
    }
    if (requireStart && !publishStartAt) {
      showAlert("오류", "예약 시작 시간을 입력해 주세요.", "확인");
      return null;
    }
    if (
      publishStartAt &&
      publishEndAt &&
      new Date(publishEndAt).getTime() <= new Date(publishStartAt).getTime()
    ) {
      showAlert("오류", "종료 시간은 시작 시간보다 늦어야 합니다.", "확인");
      return null;
    }

    const imageFileId = await uploadCharacterImage(selectedProduct);
    return {
      product_id: selectedProduct.productId,
      character_scope_key: characterScopeKey,
      ...(imageFileId ? { character_image_file_id: imageFileId } : {}),
      card_order: order,
      ...(publishStartAt
        ? { publish_start_at: toApiDateTime(publishStartAt) }
        : {}),
      publish_end_at: publishEndAt ? toApiDateTime(publishEndAt) : null,
    } satisfies IMainCharacterSlotRequest;
  };

  const handleCreateSchedule = async () => {
    if (isSaving) return;
    try {
      const body = await buildRequest(true);
      if (!body) return;
      await createSlot.mutateAsync(body);
      showAlert("완료", "캐릭터 카드 예약을 등록했습니다.", "확인");
      resetForm();
      await refetch();
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  const handlePublishNow = async () => {
    if (isSaving) return;
    try {
      const body = await buildRequest(false);
      if (!body) return;
      await publishNow.mutateAsync(body);
      showAlert("완료", "캐릭터 카드를 바로 노출했습니다.", "확인");
      resetForm();
      await refetch();
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  const handleUpdate = async () => {
    if (!editingSlot || isSaving) return;
    try {
      const body = await buildRequest(true);
      if (!body) return;
      await updateSlot.mutateAsync({
        characterSlotId: editingSlot.characterSlotId,
        body,
      });
      showAlert("완료", "캐릭터 카드를 수정했습니다.", "확인");
      resetForm();
      await refetch();
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  const handleDelete = async (row: IMainCharacterSlot) => {
    const result = await confirm({
      title: "캐릭터 카드를 삭제하시겠습니까?",
      text: `${row.characterName} 카드가 메인에서 제외됩니다.`,
      confirm: "삭제",
      cancel: "취소",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteSlot.mutateAsync(row.characterSlotId);
      if (editingSlot?.characterSlotId === row.characterSlotId) resetForm();
      await refetch();
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  const handleDisplayModeChange = async (
    nextMode: MainCharacterSlotDisplayMode,
  ) => {
    if (nextMode === displayMode) return;
    try {
      await updateDisplayMode.mutateAsync({ display_mode: nextMode });
      await refetchConfig();
      showAlert("저장 완료", "홈 주인공챗 노출 모드를 변경했습니다.", "확인");
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  if ((isLoading && !data) || (isLoadingConfig && !configData)) {
    return <FullPageLoader isLoading />;
  }

  if (isConfigError || !displayMode) {
    return (
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="" />
        <div className="flex min-h-[240px] flex-1 flex-col items-center justify-center gap-3 p-5 pt-0">
          <p role="alert" className="text-sm text-muted-foreground">
            홈 구좌 설정을 불러오지 못했습니다.
          </p>
          <Button
            variant="outline"
            onClick={() => void refetchConfig()}
            disabled={isFetchingConfig}
          >
            {isFetchingConfig ? "불러오는 중..." : "다시 불러오기"}
          </Button>
        </div>
      </SidebarInset>
    );
  }

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="" />
      <div className="flex flex-1 flex-col gap-4 p-5 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">캐릭터챗 노출 관리</h1>
          {editingSlot && (
            <Button variant="outline" onClick={resetForm}>
              등록 모드로 전환
            </Button>
          )}
        </div>

        <div className="rounded-md border bg-background px-4 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <Label htmlFor="main-character-display-mode">홈 구좌 노출 방식</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {displayMode === "auto"
                  ? "추천순 상위 후보군에서 무작위로 12명을 노출합니다. 기본 이미지가 아닌 실제 이미지 → 자산 준비 → 주인공 순으로 우선합니다."
                  : "아래 메인 12명 편성의 공개 순서대로 홈에 노출합니다."}
              </p>
            </div>
            <Select
              value={displayMode}
              onValueChange={(value) =>
                void handleDisplayModeChange(
                  value as MainCharacterSlotDisplayMode,
                )
              }
              disabled={updateDisplayMode.isPending}
            >
              <SelectTrigger id="main-character-display-mode" className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">자동 모드</SelectItem>
                <SelectItem value="manual">수동 선택 모드</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-b">
          <div
            className="flex gap-6"
            role="tablist"
            aria-label="캐릭터챗 노출 구역"
          >
            {[
              { value: "main", label: "메인 12명 편성" },
              { value: "catalog", label: "전체 공개" },
              { value: "candidates", label: "후보 검수" },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.value}
                onClick={() =>
                  setActiveTab(tab.value as "main" | "catalog" | "candidates")
                }
                className={`border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.value
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {activeTab === "main" && (
            <>
              {displayMode === "auto"
                ? `자동 모드에서는 추천순 상위 후보군을 기준으로 홈 요청마다 편성합니다. 아래 ${mainRows.length}명은 수동 선택 모드 전환 시 사용할 예비 편성입니다.`
                : `전체 공개 목록 중 서버 공개 조건을 통과한 수동 편성 상위 ${mainRows.length}명이 홈에 노출됩니다.`}
            </>
          )}
          {activeTab === "catalog" && (
            <>
              더보기 페이지에 노출되는 전체 목록입니다. 현재{" "}
              {publiclyEligibleRows.length}명입니다.
            </>
          )}
          {activeTab === "candidates" && (
            <>
              캐릭터별 회차·RP 예시·장면 증거를 확인하고 공개 순서를 지정합니다.
            </>
          )}
        </div>

        {activeTab === "candidates" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingSlot ? "캐릭터 카드 수정" : "캐릭터 카드 등록"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="character-product-search">작품 선택</Label>
                  <span className="text-xs text-muted-foreground">
                    {productListData?.total_count ?? 0}개
                  </span>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="character-product-search"
                    value={productSearchInput}
                    onChange={(event) => setProductSearchInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        searchProducts();
                      }
                    }}
                    placeholder="작품명 또는 작가명"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={searchProducts}
                    disabled={isLoadingProducts}
                  >
                    검색
                  </Button>
                </div>
                <div className="max-h-[360px] overflow-y-auto rounded-md border">
                  {isLoadingProducts && (
                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      작품 불러오는 중
                    </div>
                  )}
                  {productResults.map((product) => (
                    <button
                      type="button"
                      key={product.productId}
                      onClick={() => selectProduct(product)}
                      aria-pressed={selectedProduct?.productId === product.productId}
                      className={`flex min-h-16 w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0 ${
                        selectedProduct?.productId === product.productId
                          ? "bg-muted"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {product.coverImagePath ? (
                        <img
                          src={getCdnUrl(product.coverImagePath)}
                          alt=""
                          className="h-12 w-9 shrink-0 rounded-sm object-cover"
                        />
                      ) : (
                        <span className="h-12 w-9 shrink-0 rounded-sm bg-muted-foreground/10" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {product.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {product.authorNickname} · 공개 {product.openEpisodeCount}화
                        </span>
                      </span>
                      <span
                        title={CHAT_QUALITY[product.chatQuality].description}
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${CHAT_QUALITY[product.chatQuality].className}`}
                      >
                        {CHAT_QUALITY[product.chatQuality].label}
                      </span>
                      {selectedProduct?.productId === product.productId && (
                        <Check className="h-4 w-4 shrink-0" aria-hidden />
                      )}
                    </button>
                  ))}
                  {!isLoadingProducts && productResults.length === 0 && (
                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                      표시할 작품이 없습니다.
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProductPage((current) => Math.max(1, current - 1))}
                    disabled={productPage <= 1 || isLoadingProducts}
                  >
                    이전
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {productPage} / {productTotalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setProductPage((current) => Math.min(productTotalPages, current + 1))
                    }
                    disabled={productPage >= productTotalPages || isLoadingProducts}
                  >
                    다음
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>주인공 선택</Label>
                <Select
                  value={characterScopeKey}
                  onValueChange={setCharacterScopeKey}
                  disabled={!selectedProduct || isLoadingRoster || roster.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedProduct
                          ? "작품을 먼저 선택해 주세요"
                          : isLoadingRoster
                            ? "인물 불러오는 중"
                            : roster.length === 0
                              ? "선택 가능한 인물이 없습니다"
                              : "노출할 인물을 선택해 주세요"
                      }
                    >
                      {selectedCharacter?.displayName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {roster.map((item) => {
                      const aliases = item.aliases.filter(
                        (alias) => alias !== item.displayName
                      );
                      return (
                        <SelectItem
                          key={item.scopeKey}
                          value={item.scopeKey}
                          disabled={item.chatQuality === "insufficient"}
                        >
                          <span>{item.displayName}</span>
                          {aliases.length > 0 ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({aliases.join(", ")})
                            </span>
                          ) : null}
                          <span className="ml-2 text-xs text-muted-foreground">
                            회차 {item.distinctEpisodeCount} · 예시{" "}
                            {item.exampleCount} · 장면 {item.sceneCount}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedCharacter && (
                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
                    <div className="font-medium">
                      {CHAT_QUALITY[selectedCharacter.chatQuality].label} ·{" "}
                      {selectedCharacter.qualityReason}
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      회차 {selectedCharacter.distinctEpisodeCount} · RP 예시{" "}
                      {selectedCharacter.exampleCount} · 장면{" "}
                      {selectedCharacter.sceneCount}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>캐릭터 이미지</Label>
                <FileUpload
                  fileName={
                    characterImage?.name ||
                    currentCharacterImageUrl ||
                    fallbackCharacterImageUrl
                  }
                  onFileChange={handleCharacterImageChange}
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  disabled={isSaving}
                  buttonText="이미지 찾기"
                />
                {characterImagePreview ? (
                  <div className="relative aspect-[364/414] w-[182px] overflow-hidden rounded-md border bg-muted">
                    <img
                      src={characterImagePreview}
                      alt="캐릭터 이미지 미리보기"
                      className="h-full w-full object-cover object-top"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      aria-label="캐릭터 이미지 크롭"
                      title="이미지 크롭"
                      onClick={() => void openCropDialog()}
                      disabled={isSaving}
                      className="absolute bottom-2 right-2 h-9 w-9 border bg-background/90 shadow-sm"
                    >
                      <Crop className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  권장 {CHARACTER_IMAGE_WIDTH} × {CHARACTER_IMAGE_HEIGHT}px 이상 ·
                  364:414 비율 · JPG, PNG, WebP
                  <br />미등록 시 작품 표지를 상단 기준으로 자동 크롭합니다.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-card-order">카드 순서</Label>
                <Input
                  id="character-card-order"
                  type="number"
                  min={1}
                  value={cardOrder}
                  onChange={(event) => setCardOrder(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-start-at">노출 시작</Label>
                <Input
                  id="character-start-at"
                  type="datetime-local"
                  value={publishStartAt}
                  onChange={(event) => setPublishStartAt(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="character-end-at">노출 종료</Label>
                <Input
                  id="character-end-at"
                  type="datetime-local"
                  value={publishEndAt}
                  onChange={(event) => setPublishEndAt(event.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {editingSlot ? (
                <Button
                  onClick={handleUpdate}
                  disabled={
                    isSaving ||
                    !selectedCharacter ||
                    selectedCharacter.chatQuality === "insufficient"
                  }
                >
                  수정 저장
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handlePublishNow}
                    disabled={
                      isSaving ||
                      !selectedCharacter ||
                      selectedCharacter.chatQuality === "insufficient"
                    }
                  >
                    지금 노출
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCreateSchedule}
                    disabled={
                      isSaving ||
                      !selectedCharacter ||
                      selectedCharacter.chatQuality === "insufficient"
                    }
                  >
                    예약 등록
                  </Button>
                </>
              )}
            </div>
            </CardContent>
          </Card>
        )}

        <CharacterImageCropDialog
          file={cropSourceFile}
          open={isCropOpen}
          onOpenChange={setIsCropOpen}
          onConfirm={setCharacterImage}
        />

        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "main"
                ? displayMode === "auto"
                  ? `수동 모드 예비 편성 ${mainRows.length}/12명`
                  : `홈 노출 ${mainRows.length}/12명`
                : activeTab === "catalog"
                  ? `전체 공개 ${publiclyEligibleRows.length}명`
                  : `검수 필요·예약·종료 ${reviewRows.length}명`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이미지</TableHead>
                    <TableHead>캐릭터</TableHead>
                    <TableHead>작품</TableHead>
                    <TableHead>순서</TableHead>
                    <TableHead>기간</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.map((row) => (
                    <TableRow key={row.characterSlotId}>
                      <TableCell>
                        {row.characterImagePath ? (
                          <img
                            src={getCdnUrl(row.characterImagePath)}
                            alt=""
                            className="h-12 w-12 rounded object-cover object-top"
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{row.characterName}</TableCell>
                      <TableCell>
                        <div>{row.productTitle}</div>
                        <div className="text-xs text-muted-foreground">{row.authorNickname}</div>
                      </TableCell>
                      <TableCell>{row.cardOrder}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatDateTime(row.publishStartAt)}
                        <br />~ {formatDateTime(row.publishEndAt)}
                      </TableCell>
                      <TableCell>
                        {row.publicEligible ? getSlotStatus(row) : "공개조건 미달"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(row)}>
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleDelete(row)}
                            disabled={deleteSlot.isPending}
                          >
                            삭제
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visibleRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        이 구역에 표시할 캐릭터 카드가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
