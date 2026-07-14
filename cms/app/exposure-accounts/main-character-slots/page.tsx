"use client";

import {
  useCreateMainCharacterSlot,
  useDeleteMainCharacterSlot,
  useGetMainCharacterSlotProducts,
  useGetMainCharacterSlotRoster,
  useGetMainCharacterSlots,
  usePublishMainCharacterSlotNow,
  useUpdateMainCharacterSlot,
} from "@/api/mainCharacterSlot";
import {
  IMainCharacterSlot,
  IMainCharacterSlotProduct,
  IMainCharacterSlotRequest,
} from "@/api/mainCharacterSlot/dto";
import { useCreateUpload, useUpdateUpload } from "@/api/upload";
import { FileUpload } from "@/components/common/FileUpload";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
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
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { format } from "date-fns";
import { Check, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

const PAGE_SIZE = 20;

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
  const [page, setPage] = useState(1);
  const [productFilter, setProductFilter] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<IMainCharacterSlotProduct | null>(null);
  const [characterScopeKey, setCharacterScopeKey] = useState("");
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [cardOrder, setCardOrder] = useState("1");
  const [publishStartAt, setPublishStartAt] = useState("");
  const [publishEndAt, setPublishEndAt] = useState("");
  const [editingSlot, setEditingSlot] = useState<IMainCharacterSlot | null>(null);

  const { data, isLoading, refetch } = useGetMainCharacterSlots({
    page,
    count_per_page: PAGE_SIZE,
  });
  const { data: productListData, isFetching: isLoadingProducts } =
    useGetMainCharacterSlotProducts();
  const { data: rosterData, isFetching: isLoadingRoster } =
    useGetMainCharacterSlotRoster(selectedProduct?.productId ?? null);
  const createSlot = useCreateMainCharacterSlot();
  const publishNow = usePublishMainCharacterSlotNow();
  const updateSlot = useUpdateMainCharacterSlot();
  const deleteSlot = useDeleteMainCharacterSlot();
  const createUpload = useCreateUpload();
  const updateUpload = useUpdateUpload();

  const rows = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total_count ?? 0) / PAGE_SIZE));
  const roster = rosterData?.data ?? [];
  const isSaving =
    createSlot.isPending ||
    publishNow.isPending ||
    updateSlot.isPending ||
    createUpload.isPending ||
    updateUpload.isPending;
  const productResults = useMemo(
    () => {
      const products = productListData?.data ?? [];
      const filter = productFilter.trim().toLocaleLowerCase("ko-KR");
      if (!filter) return products;
      return products.filter((product) =>
        `${product.title} ${product.authorNickname}`
          .toLocaleLowerCase("ko-KR")
          .includes(filter)
      );
    },
    [productFilter, productListData?.data]
  );

  const resetForm = () => {
    setSelectedProduct(null);
    setCharacterScopeKey("");
    setCharacterImage(null);
    setCardOrder("1");
    setPublishStartAt("");
    setPublishEndAt("");
    setEditingSlot(null);
  };

  const selectProduct = (product: IMainCharacterSlotProduct) => {
    setSelectedProduct(product);
    setCharacterScopeKey("");
  };

  const handleEdit = (row: IMainCharacterSlot) => {
    setEditingSlot(row);
    setSelectedProduct({
      productId: row.productId,
      title: row.productTitle,
      authorNickname: row.authorNickname,
      coverImagePath: null,
      openEpisodeCount: 0,
    });
    setCharacterScopeKey(row.characterScopeKey);
    setCharacterImage(null);
    setCardOrder(String(row.cardOrder));
    setPublishStartAt(toInputDateTime(row.publishStartAt));
    setPublishEndAt(toInputDateTime(row.publishEndAt));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadCharacterImage = async () => {
    if (!characterImage) return undefined;
    const upload = await createUpload.mutateAsync({
      group_type: "character",
      file_name: characterImage.name,
    });
    await updateUpload.mutateAsync({
      url: upload.data.uploadPath,
      file: characterImage,
      file_type: characterImage.type || "application/octet-stream",
    });
    return upload.data.fileId;
  };

  const buildRequest = async (requireStart: boolean) => {
    if (!selectedProduct || !characterScopeKey) {
      showAlert("오류", "작품과 주인공을 선택해 주세요.", "확인");
      return null;
    }
    if (!editingSlot && !characterImage) {
      showAlert("오류", "캐릭터 이미지를 선택해 주세요.", "확인");
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

    const imageFileId = await uploadCharacterImage();
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

  if (isLoading && !data) return <FullPageLoader isLoading />;

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="" />
      <div className="flex flex-1 flex-col gap-4 p-5 pt-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">메인 캐릭터챗 구좌 관리</h1>
          {editingSlot && (
            <Button variant="outline" onClick={resetForm}>
              등록 모드로 전환
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{editingSlot ? "캐릭터 카드 수정" : "캐릭터 카드 등록"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="character-product-filter">작품 선택</Label>
                  <span className="text-xs text-muted-foreground">
                    {productResults.length}개
                  </span>
                </div>
                <Input
                  id="character-product-filter"
                  value={productFilter}
                  onChange={(event) => setProductFilter(event.target.value)}
                  placeholder="작품명·작가명으로 목록 필터"
                />
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
              </div>
              <div className="space-y-2">
                <Label>주인공 선택</Label>
                <div className="max-h-[406px] overflow-y-auto rounded-md border">
                  {!selectedProduct && (
                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                      선택된 작품이 없습니다.
                    </div>
                  )}
                  {selectedProduct && isLoadingRoster && (
                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      주인공 불러오는 중
                    </div>
                  )}
                  {selectedProduct &&
                    !isLoadingRoster &&
                    roster.map((item) => (
                      <button
                        type="button"
                        key={item.scopeKey}
                        onClick={() => setCharacterScopeKey(item.scopeKey)}
                        aria-pressed={characterScopeKey === item.scopeKey}
                        className={`flex min-h-14 w-full items-center justify-between gap-3 border-b px-3 py-2 text-left last:border-b-0 ${
                          characterScopeKey === item.scopeKey
                            ? "bg-muted"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {item.displayName}
                          </span>
                          {item.aliases.length > 0 && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.aliases.join(", ")}
                            </span>
                          )}
                        </span>
                        {characterScopeKey === item.scopeKey && (
                          <Check className="h-4 w-4 shrink-0" aria-hidden />
                        )}
                      </button>
                    ))}
                  {selectedProduct && !isLoadingRoster && roster.length === 0 && (
                    <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                      선택 가능한 주인공이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>캐릭터 이미지</Label>
                <FileUpload
                  fileName={characterImage?.name || ""}
                  onFileChange={setCharacterImage}
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  disabled={isSaving}
                />
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
                <Button onClick={handleUpdate} disabled={isSaving}>
                  수정 저장
                </Button>
              ) : (
                <>
                  <Button onClick={handlePublishNow} disabled={isSaving}>
                    지금 노출
                  </Button>
                  <Button variant="outline" onClick={handleCreateSchedule} disabled={isSaving}>
                    예약 등록
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>캐릭터 카드 목록</CardTitle>
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
                  {rows.map((row) => (
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
                      <TableCell>{getSlotStatus(row)}</TableCell>
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
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        등록된 캐릭터 카드가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4">
              <PaginationControls page={page} setPage={setPage} totalPages={totalPages} />
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
