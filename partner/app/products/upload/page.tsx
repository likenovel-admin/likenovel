"use client";

import {
  getDownloadProducts,
  useCreateProduct,
  useGetProductCpCompany,
  useGetProductDetail,
  useGetProductDetailsGroup,
  useGetProductGenre,
  useUpdateProduct,
} from "@/api/product";
import {
  EpisodeApplyStatusCode,
  ICreateProductRequest,
  IUpdateProductRequest,
} from "@/api/product/dto";
import {
  useCancelEpisodeReview,
  useCancelReserveEpisodeSale,
  useDeleteEpisodes,
  useRequestEpisodeReview,
  useReserveEpisodeSale,
  useStartEpisodeSale,
} from "@/api/product-episode-upload";
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
import {
  catchErrorMessage,
  confirm,
  isPositiveIntegerInput,
  showAlert,
} from "@/lib/utils";
import { ChevronLeft, ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

type PublicationType = "serial" | "volume";
type LaunchType = "promotion" | "normal";
type RatingType = "all" | "15" | "19";
type OngoingType = "ongoing" | "rest" | "end" | "stop";

type FormState = {
  title: string;
  authorName: string;
  publicationType: PublicationType;
  launchType: LaunchType;
  rating: RatingType;
  statusCode: OngoingType;
  primaryGenreId: string;
  subGenreId: string;
  uci: string;
  isbn: string;
  serialPrice: string;
  volumePrice: string;
  volumeRentalPrice: string;
  cpCompanyName: string;
  freeEpisodeStartNo: string;
  freeEpisodeEndNo: string;
  monopolyYn: boolean;
  blindYn: boolean;
  synopsis: string;
};

const REQUIRED_MARK = <span className="ml-1 text-[#E54949]">*</span>;

const INITIAL_FORM: FormState = {
  title: "",
  authorName: "",
  publicationType: "serial",
  launchType: "normal",
  rating: "all",
  statusCode: "end",
  primaryGenreId: "",
  subGenreId: "",
  uci: "",
  isbn: "",
  serialPrice: "100",
  volumePrice: "",
  volumeRentalPrice: "",
  cpCompanyName: "",
  freeEpisodeStartNo: "",
  freeEpisodeEndNo: "",
  monopolyYn: false,
  blindYn: false,
  synopsis: "",
};

const ONGOING_OPTIONS: { value: OngoingType; label: string }[] = [
  { value: "ongoing", label: "연재중" },
  { value: "rest", label: "휴재" },
  { value: "end", label: "완결" },
  { value: "stop", label: "중단" },
];

const formatEpisodeDate = (dateValue?: string | null) => {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${`${date.getMonth() + 1}`.padStart(2, "0")}.${`${date.getDate()}`.padStart(2, "0")}`;
};

const getEpisodeStatusLabel = (episode: {
  openYn?: "Y" | "N";
  episodeOpenYn?: "Y" | "N";
  useYn?: "Y" | "N";
  latestApplyStatus?: EpisodeApplyStatusCode | null;
  reviewYn?: "Y" | "N";
  publishReserveDate?: string | null;
}) => {
  const effectiveOpenYn = episode.openYn ?? episode.episodeOpenYn ?? "N";
  const reserveAt =
    episode.publishReserveDate && new Date(episode.publishReserveDate).getTime() > Date.now();

  if ((episode.useYn ?? "Y") !== "Y") return "-";
  if (episode.latestApplyStatus === "denied") return "반려";
  if (episode.latestApplyStatus === "cancel") return "업로드완료";
  if (episode.latestApplyStatus === "review" || episode.reviewYn === "Y") return "심사중";
  if (effectiveOpenYn === "Y") return "판매중";
  if (episode.latestApplyStatus === "accepted") return reserveAt ? "판매예약" : "승인완료";
  if (reserveAt) return "판매예약";
  return "업로드완료";
};

export default function ProductUploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { userProfile, isInitialized } = useProfile();
  const mode = searchParams.get("mode");
  const editProductId = searchParams.get("id");
  const isEditMode = mode === "edit" && !!editProductId;
  const isViewMode = mode === "view" && !!editProductId;
  const isDetailMode = isEditMode || isViewMode;
  const isReadOnlyMode = isViewMode;

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const requestEpisodeReview = useRequestEpisodeReview();
  const cancelEpisodeReview = useCancelEpisodeReview();
  const deleteEpisodes = useDeleteEpisodes();
  const startEpisodeSale = useStartEpisodeSale();
  const reserveEpisodeSale = useReserveEpisodeSale();
  const cancelReserveEpisodeSale = useCancelReserveEpisodeSale();
  const { data: genres } = useGetProductGenre();
  const { data: cpCompanies } = useGetProductCpCompany();
  const {
    data: productDetail,
    isLoading: isProductDetailLoading,
    isFetching: isProductDetailFetching,
    isError: isProductDetailError,
  } = useGetProductDetail(editProductId || "", isDetailMode);
  const {
    data: productDetailsGroup,
    isLoading: isEpisodeSectionLoading,
    isFetching: isEpisodeSectionFetching,
  } = useGetProductDetailsGroup(editProductId || "", isDetailMode);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverImageFileId, setCoverImageFileId] = useState<number | null>(null);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<number[]>([]);
  const [reserveDateTime, setReserveDateTime] = useState("");

  const primaryGenres = useMemo(
    () => genres?.filter((genre) => genre.major_genre_yn === "Y") ?? [],
    [genres]
  );
  const subGenres = useMemo(
    () => genres?.filter((genre) => genre.major_genre_yn !== "Y") ?? [],
    [genres]
  );

  const episodes = useMemo(() => {
    const list = productDetailsGroup?.data?.episodes ?? [];
    return [...list]
      .filter((episode) => (episode.useYn ?? "Y") === "Y")
      .sort((a, b) => (a.episodeNo ?? 0) - (b.episodeNo ?? 0));
  }, [productDetailsGroup]);

  const totalEpisodeCount = episodes.length;
  const sellingEpisodeCount = episodes.filter((episode) => {
    const effectiveOpenYn = episode.openYn ?? episode.episodeOpenYn;
    const effectiveUseYn = episode.useYn ?? "Y";
    return effectiveOpenYn === "Y" && effectiveUseYn === "Y";
  }).length;

  const isFreeProduct = isDetailMode && productDetail?.price_type === "free";
  const productType = productDetail?.product_type ?? productDetail?.productType ?? null;

  const canManage =
    userProfile?.role_type === "admin" || userProfile?.role_type === "CP";
  const isAdmin = userProfile?.role_type === "admin";
  const isSubmitting = createProduct.isPending || updateProduct.isPending;
  const isApplyingReview = requestEpisodeReview.isPending;
  const isCancellingReview = cancelEpisodeReview.isPending;
  const isDeletingEpisodes = deleteEpisodes.isPending;
  const isStartingSale = startEpisodeSale.isPending;
  const isReservingSale = reserveEpisodeSale.isPending;
  const isCancellingReserve = cancelReserveEpisodeSale.isPending;
  const isActionPending =
    isApplyingReview ||
    isCancellingReview ||
    isDeletingEpisodes ||
    isStartingSale ||
    isReservingSale ||
    isCancellingReserve;
  const allEpisodeSelected =
    episodes.length > 0 &&
    episodes.every((episode) => selectedEpisodeIds.includes(episode.episodeId));

  const handlePublicationTypeChange = (value: PublicationType) => {
    setForm((prev) => ({
      ...prev,
      publicationType: value,
      serialPrice: value === "serial" ? "100" : prev.serialPrice || "100",
      statusCode: value === "serial" ? "end" : prev.statusCode,
    }));
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  useEffect(() => {
    const episodeIdSet = new Set<number>(episodes.map((episode) => episode.episodeId));
    setSelectedEpisodeIds((prev) => prev.filter((id) => episodeIdSet.has(id)));
  }, [episodes]);

  useEffect(() => {
    if (!isDetailMode || !productDetail) return;

    const isVolumeType =
      (productDetail.single_regular_price ?? 0) > 0 &&
      (productDetail.series_regular_price ?? 0) <= 0;

    const detailWithOptional = productDetail as typeof productDetail & {
      synopsis?: string;
      cover_image_path?: string;
      coverImagePath?: string;
      thumbnail_file_id?: number;
      cover_image_file_id?: number;
    };

    const freeEpisodeStartNo = productDetail.free_episode_start_no ?? null;
    const freeEpisodeEndNo =
      productDetail.free_episode_end_no ??
      ((productDetail.paid_episode_no ?? 0) > 1
        ? (productDetail.paid_episode_no as number) - 1
        : null);

    setForm((prev) => ({
      ...prev,
      title: productDetail.title ?? "",
      authorName: productDetail.author_nickname ?? "",
      publicationType: isVolumeType ? "volume" : "serial",
      rating:
        productDetail.ratings_code === "adult"
          ? "19"
          : productDetail.ratings_code === "15"
            ? "15"
            : "all",
      statusCode: isVolumeType
        ? (["ongoing", "rest", "end", "stop"] as OngoingType[]).includes(
            productDetail.status_code as OngoingType
          )
          ? (productDetail.status_code as OngoingType)
          : "ongoing"
        : "end",
      primaryGenreId: productDetail.primary_genre_id
        ? String(productDetail.primary_genre_id)
        : "",
      subGenreId: productDetail.sub_genre_id ? String(productDetail.sub_genre_id) : "",
      uci: productDetail.uci ?? "",
      isbn: productDetail.isbn ?? "",
      serialPrice: isVolumeType ? String(productDetail.series_regular_price ?? 0) : "100",
      volumePrice: String(productDetail.single_regular_price ?? 0),
      volumeRentalPrice: String(productDetail.single_rental_price ?? 0),
      cpCompanyName: productDetail.cp_company_name ?? "",
      freeEpisodeStartNo:
        freeEpisodeStartNo !== null && freeEpisodeStartNo !== undefined
          ? String(freeEpisodeStartNo)
          : "",
      freeEpisodeEndNo:
        freeEpisodeEndNo !== null && freeEpisodeEndNo !== undefined
          ? String(freeEpisodeEndNo)
          : "",
      monopolyYn: productDetail.monopoly_yn === "Y",
      blindYn: productDetail.blind_yn === "Y",
      synopsis: detailWithOptional.synopsis ?? "",
    }));

    const existingCoverPath = detailWithOptional.cover_image_path || detailWithOptional.coverImagePath;
    if (existingCoverPath) setCoverPreview((prev) => prev ?? existingCoverPath);

    const existingCoverId =
      detailWithOptional.cover_image_file_id || detailWithOptional.thumbnail_file_id;
    if (existingCoverId) setCoverImageFileId((prev) => prev ?? existingCoverId);
  }, [isDetailMode, productDetail]);

  const requestCoverUploadUrl = async (fileName: string) => {
    return apiClient.request<{ data: { fileId: number; uploadPath: string } }>({
      url: "/v1/command/storages/upload-url",
      method: "POST",
      body: {
        group_type: "cover",
        file_name: fileName,
      },
    });
  };

  const handleCoverUploadChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showAlert("파일 형식 오류", "이미지 파일만 업로드할 수 있습니다.", "확인");
      e.target.value = "";
      return;
    }

    try {
      setIsCoverUploading(true);
      const uploadMeta = await requestCoverUploadUrl(file.name);
      const uploadResponse = await fetch(uploadMeta.data.uploadPath, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("커버 이미지 업로드에 실패했습니다.");
      }

      setCoverImageFileId(uploadMeta.data.fileId);
      setCoverPreview((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    } finally {
      setIsCoverUploading(false);
      e.target.value = "";
    }
  };

  const validateForm = () => {
    if (!form.title.trim()) return "작품명을 입력해주세요.";
    if (!form.authorName.trim()) return "작가명을 입력해주세요.";
    if (!form.primaryGenreId) return "1차 장르를 선택해주세요.";
    if (form.primaryGenreId && form.subGenreId && form.primaryGenreId === form.subGenreId) {
      return "1차 장르와 2차 장르를 서로 다르게 선택해주세요.";
    }
    if (!isEditMode && !form.synopsis.trim()) return "작품 소개를 입력해주세요.";
    if (!form.uci.trim() && !form.isbn.trim()) return "UCI와 ISBN 중 하나 이상 입력해주세요.";

    if (form.publicationType === "serial") {
      if (Number(form.serialPrice) !== 100) {
        return "연재 가격은 100원으로 고정됩니다.";
      }
      if (!form.serialPrice || Number(form.serialPrice) <= 0) {
        return "연재 가격을 확인해주세요.";
      }
    } else {
      if (!form.volumePrice || Number(form.volumePrice) <= 0) {
        return "소장가격을 입력해주세요.";
      }
      if (!form.volumeRentalPrice || Number(form.volumeRentalPrice) <= 0) {
        return "대여가격을 입력해주세요.";
      }
    }

    const hasFreeEpisodeRangeInput =
      form.freeEpisodeStartNo.trim() !== "" || form.freeEpisodeEndNo.trim() !== "";
    if (isEditMode && hasFreeEpisodeRangeInput) {
      if (!form.freeEpisodeStartNo.trim() || !form.freeEpisodeEndNo.trim()) {
        return "무료회차 시작/종료를 모두 입력해주세요.";
      }
      const freeStartNo = Number(form.freeEpisodeStartNo);
      const freeEndNo = Number(form.freeEpisodeEndNo);
      if (
        !Number.isInteger(freeStartNo) ||
        !Number.isInteger(freeEndNo) ||
        freeStartNo <= 0 ||
        freeEndNo <= 0 ||
        freeStartNo > 999 ||
        freeEndNo > 999
      ) {
        return "무료회차 범위는 1~999 숫자만 입력 가능합니다.";
      }
      if (freeStartNo > freeEndNo) {
        return "무료회차 시작 번호가 종료 번호보다 클 수 없습니다.";
      }
    }

    return "";
  };

  const getGenreName = (id: string) => {
    if (!id || !genres) return "";
    const target = genres.find((genre) => String(genre.keyword_id) === id);
    return target?.keyword_name ?? "";
  };

  const buildCreatePayload = (): ICreateProductRequest => {
    const activePrice =
      form.publicationType === "serial" ? 100 : Number(form.volumePrice);
    return {
      cover_image_file_id: coverImageFileId ?? undefined,
      title: form.title.trim(),
      author_nickname: form.authorName.trim(),
      illustrator_nickname: null,
      ongoing_state: form.statusCode,
      update_frequency: [],
      publish_regular_yn: form.publicationType === "serial" ? "Y" : "N",
      primary_genre: getGenreName(form.primaryGenreId),
      sub_genre: getGenreName(form.subGenreId) || null,
      keywords: [],
      custom_keywords: [],
      synopsis: form.synopsis.trim(),
      adult_yn: form.rating === "19" ? "Y" : "N",
      open_yn: "N",
      monopoly_yn: form.monopolyYn ? "Y" : "N",
      cp_contract_yn: form.cpCompanyName ? "Y" : "N",
      series_regular_price: form.publicationType === "serial" ? activePrice : 0,
      single_regular_price: form.publicationType === "volume" ? activePrice : 0,
      single_rental_price:
        form.publicationType === "volume" ? Number(form.volumeRentalPrice) : 0,
    };
  };

  const buildUpdatePayload = (): IUpdateProductRequest => {
    const activePrice =
      form.publicationType === "serial" ? 100 : Number(form.volumePrice);
    const freeEpisodeStartNoInput = form.freeEpisodeStartNo.trim();
    const freeEpisodeEndNoInput = form.freeEpisodeEndNo.trim();
    const hasFreeEpisodeRange =
      freeEpisodeStartNoInput !== "" && freeEpisodeEndNoInput !== "";
    const clearFreeEpisodeRange =
      freeEpisodeStartNoInput === "" && freeEpisodeEndNoInput === "";

    return {
      author_nickname: form.authorName.trim() || undefined,
      cover_image_file_id: coverImageFileId ?? undefined,
      title: form.title.trim(),
      synopsis: form.synopsis.trim(),
      ratings_code:
        form.rating === "19" ? "adult" : form.rating === "15" ? "15" : "all",
      primary_genre_id: Number(form.primaryGenreId),
      sub_genre_id: form.subGenreId ? Number(form.subGenreId) : undefined,
      status_code: form.statusCode,
      uci: form.uci.trim() || undefined,
      isbn: form.isbn.trim() || undefined,
      series_regular_price: form.publicationType === "serial" ? activePrice : 0,
      single_regular_price: form.publicationType === "volume" ? activePrice : 0,
      single_rental_price:
        form.publicationType === "volume" ? Number(form.volumeRentalPrice) : 0,
      cp_company_name: form.cpCompanyName || undefined,
      monopoly_yn: form.monopolyYn ? "Y" : "N",
      free_episode_start_no: hasFreeEpisodeRange
        ? Number(freeEpisodeStartNoInput)
        : clearFreeEpisodeRange
          ? null
          : undefined,
      free_episode_end_no: hasFreeEpisodeRange
        ? Number(freeEpisodeEndNoInput)
        : clearFreeEpisodeRange
          ? null
          : undefined,
      ...(isEditMode && sellingEpisodeCount > 0
        ? { open_yn: form.blindYn ? "N" : "Y", blind_yn: form.blindYn ? "Y" : "N" }
        : { open_yn: "N", blind_yn: form.blindYn ? "Y" : "N" }),
    };
  };

  const findCreatedProductId = async () => {
    const result = await getDownloadProducts({
      page: 1,
      count_per_page: 20,
      search_target: "product-title",
      search_word: form.title.trim(),
    });

    const found = result.results.find(
      (item) =>
        item.title === form.title.trim() &&
        item.author_nickname === form.authorName.trim()
    );

    return found?.product_id;
  };

  const handleSubmit = async () => {
    if (!canManage) {
      showAlert(
        "권한 없음",
        "관리자/출판사만 작품 등록/수정이 가능합니다.",
        "확인"
      );
      return;
    }

    if (isCoverUploading) {
      showAlert("잠시만요", "커버 이미지 업로드가 진행 중입니다.", "확인");
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      showAlert("입력 확인", validationMessage, "확인");
      return;
    }

    try {
      if (isEditMode) {
        if (!editProductId) {
          throw new Error("수정할 작품 ID가 없습니다.");
        }

        await updateProduct.mutateAsync({
          id: editProductId,
          body: buildUpdatePayload(),
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["GetProductParams"] }),
          queryClient.invalidateQueries({
            queryKey: ["GetProductDetail", JSON.stringify(editProductId)],
          }),
          queryClient.invalidateQueries({
            queryKey: ["GetProductDetailsGroup", JSON.stringify(editProductId)],
          }),
        ]);

        await showAlert("완료", "작품 정보가 수정되었습니다.", "확인");
        router.push("/products");
        return;
      }

      const createResult = await createProduct.mutateAsync(buildCreatePayload());
      let createdProductId = createResult?.data?.product_id;

      if (!createdProductId) {
        createdProductId = await findCreatedProductId();
      }

      if (!createdProductId) {
        throw new Error("생성된 작품 ID를 찾을 수 없습니다. 다시 시도해주세요.");
      }

      await updateProduct.mutateAsync({
        id: String(createdProductId),
        body: buildUpdatePayload(),
      });

      await showAlert("완료", "신규 작품이 생성되었습니다.", "확인");
      router.push(`/products/upload?mode=edit&id=${createdProductId}`);
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  const handleReadOnlyAttempt = () => {
    showAlert("안내", "작품리스트 관리 버튼을 통해 수정해주세요.", "확인");
  };

  const toggleSelectAllEpisodes = () => {
    if (allEpisodeSelected) {
      setSelectedEpisodeIds([]);
      return;
    }
    setSelectedEpisodeIds(episodes.map((episode) => episode.episodeId));
  };

  const toggleEpisodeSelection = (episodeId: number) => {
    setSelectedEpisodeIds((prev) =>
      prev.includes(episodeId)
        ? prev.filter((id) => id !== episodeId)
        : [...prev, episodeId]
    );
  };

  const selectedEpisodes = useMemo(
    () =>
      episodes.filter((episode) => selectedEpisodeIds.includes(episode.episodeId)),
    [episodes, selectedEpisodeIds]
  );

  const reviewRequestEligibleEpisodeIds = useMemo(
    () =>
      selectedEpisodes
        .filter((episode) => {
          const status = episode.latestApplyStatus ?? null;
          return status !== "review" && status !== "accepted";
        })
        .map((episode) => episode.episodeId),
    [selectedEpisodes]
  );

  const reviewCancelEligibleApplyIds = useMemo(
    () =>
      selectedEpisodes
        .filter(
          (episode) =>
            episode.latestApplyStatus === "review" &&
            typeof episode.latestApplyId === "number"
        )
        .map((episode) => episode.latestApplyId as number),
    [selectedEpisodes]
  );

  const saleStartEligibleEpisodeIds = useMemo(
    () =>
      selectedEpisodes
        .filter(
          (episode) =>
            episode.latestApplyStatus === "accepted" &&
            (episode.openYn ?? episode.episodeOpenYn ?? "N") !== "Y"
        )
        .map((episode) => episode.episodeId),
    [selectedEpisodes]
  );

  const saleReserveEligibleEpisodeIds = useMemo(
    () =>
      selectedEpisodes
        .filter(
          (episode) =>
            episode.latestApplyStatus === "accepted" &&
            (episode.openYn ?? episode.episodeOpenYn ?? "N") !== "Y"
        )
        .map((episode) => episode.episodeId),
    [selectedEpisodes]
  );

  const reserveCancelEligibleEpisodeIds = useMemo(
    () =>
      selectedEpisodes
        .filter(
          (episode) =>
            (episode.openYn ?? episode.episodeOpenYn ?? "N") !== "Y" &&
            episode.publishReserveDate &&
            new Date(episode.publishReserveDate).getTime() > Date.now()
        )
        .map((episode) => episode.episodeId),
    [selectedEpisodes]
  );

  const deleteEligibleEpisodeIds = useMemo(
    () =>
      selectedEpisodes
        .filter((episode) => (episode.latestApplyStatus ?? null) !== "review")
        .map((episode) => episode.episodeId),
    [selectedEpisodes]
  );

  const invalidateEpisodeQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["GetProductDetailsGroup", JSON.stringify(editProductId || "")],
      }),
      queryClient.invalidateQueries({
        queryKey: ["GetProductDetail", JSON.stringify(editProductId || "")],
      }),
      queryClient.invalidateQueries({ queryKey: ["GetProductParams"] }),
    ]);
  };

  const handleRequestSelectedReviews = async () => {
    if (!selectedEpisodeIds.length) {
      showAlert("안내", "심사신청할 회차를 먼저 선택해주세요.", "확인");
      return;
    }
    if (!reviewRequestEligibleEpisodeIds.length) {
      showAlert("안내", "선택한 회차 중 심사신청 가능한 회차가 없습니다.", "확인");
      return;
    }

    const confirmResult = await confirm({
      title: "심사신청",
      text: `선택한 회차 ${reviewRequestEligibleEpisodeIds.length}건을 심사신청 하시겠습니까?`,
      confirm: "심사신청",
      cancel: "취소",
    });
    if (!confirmResult.isConfirmed) return;

    try {
      await requestEpisodeReview.mutateAsync({
        episode_ids: reviewRequestEligibleEpisodeIds,
      });
      await invalidateEpisodeQueries();
      setSelectedEpisodeIds([]);
      await showAlert("완료", "선택 회차가 심사중으로 접수되었습니다.", "확인");
    } catch (error) {
      showAlert("심사신청 실패", catchErrorMessage(error), "확인");
    }
  };

  const handleCancelSelectedReviews = async () => {
    if (!selectedEpisodeIds.length) {
      showAlert("안내", "심사신청 취소할 회차를 먼저 선택해주세요.", "확인");
      return;
    }
    if (!reviewCancelEligibleApplyIds.length) {
      showAlert("안내", "선택한 회차 중 심사취소 가능한 회차가 없습니다.", "확인");
      return;
    }

    const confirmResult = await confirm({
      title: "심사신청 취소",
      text: `선택한 회차 ${reviewCancelEligibleApplyIds.length}건의 심사신청을 취소하시겠습니까?`,
      confirm: "취소 진행",
      cancel: "취소",
    });
    if (!confirmResult.isConfirmed) return;

    try {
      await cancelEpisodeReview.mutateAsync({ apply_ids: reviewCancelEligibleApplyIds });
      await invalidateEpisodeQueries();
      setSelectedEpisodeIds([]);
      await showAlert("완료", "선택한 회차의 심사신청이 취소되었습니다.", "확인");
    } catch (error) {
      showAlert("취소 실패", catchErrorMessage(error), "확인");
    }
  };

  const handleStartSale = async () => {
    if (!selectedEpisodeIds.length) {
      showAlert("안내", "판매시작할 회차를 먼저 선택해주세요.", "확인");
      return;
    }
    if (!saleStartEligibleEpisodeIds.length) {
      showAlert("안내", "선택한 회차 중 판매시작 가능한 회차가 없습니다.", "확인");
      return;
    }

    const confirmResult = await confirm({
      title: "판매시작",
      text: `선택한 회차 ${saleStartEligibleEpisodeIds.length}건을 즉시 판매시작 하시겠습니까?`,
      confirm: "판매시작",
      cancel: "취소",
    });
    if (!confirmResult.isConfirmed) return;

    try {
      await startEpisodeSale.mutateAsync({ episode_ids: saleStartEligibleEpisodeIds });
      await invalidateEpisodeQueries();
      setSelectedEpisodeIds([]);
      await showAlert("완료", "선택 회차 판매가 시작되었습니다.", "확인");
    } catch (error) {
      showAlert("판매시작 실패", catchErrorMessage(error), "확인");
    }
  };

  const handleReserveSale = async () => {
    if (!selectedEpisodeIds.length) {
      showAlert("안내", "판매예약할 회차를 먼저 선택해주세요.", "확인");
      return;
    }
    if (!saleReserveEligibleEpisodeIds.length) {
      showAlert("안내", "선택한 회차 중 판매예약 가능한 회차가 없습니다.", "확인");
      return;
    }
    if (!reserveDateTime) {
      showAlert("입력 확인", "판매예약 일시를 선택해주세요.", "확인");
      return;
    }

    const reserveDate = new Date(reserveDateTime);
    if (Number.isNaN(reserveDate.getTime())) {
      showAlert("입력 확인", "유효한 판매예약 일시를 선택해주세요.", "확인");
      return;
    }
    if (reserveDate.getTime() <= Date.now()) {
      showAlert("입력 확인", "판매예약 일시는 현재 시간 이후로 선택해주세요.", "확인");
      return;
    }

    try {
      await reserveEpisodeSale.mutateAsync({
        episode_ids: saleReserveEligibleEpisodeIds,
        publish_reserve_date: reserveDate.toISOString(),
      });
      await invalidateEpisodeQueries();
      setSelectedEpisodeIds([]);
      await showAlert("완료", "선택 회차가 판매예약 처리되었습니다.", "확인");
    } catch (error) {
      showAlert("판매예약 실패", catchErrorMessage(error), "확인");
    }
  };

  const handleCancelReserveSale = async () => {
    if (!selectedEpisodeIds.length) {
      showAlert("안내", "예약취소할 회차를 먼저 선택해주세요.", "확인");
      return;
    }
    if (!reserveCancelEligibleEpisodeIds.length) {
      showAlert("안내", "선택한 회차 중 예약취소 가능한 회차가 없습니다.", "확인");
      return;
    }

    const confirmResult = await confirm({
      title: "판매예약 취소",
      text: `선택한 회차 ${reserveCancelEligibleEpisodeIds.length}건의 판매예약을 취소하시겠습니까?`,
    });
    if (!confirmResult) return;

    try {
      await cancelReserveEpisodeSale.mutateAsync({
        episode_ids: reserveCancelEligibleEpisodeIds,
      });
      await invalidateEpisodeQueries();
      setSelectedEpisodeIds([]);
      await showAlert("완료", "선택 회차의 판매예약이 취소되었습니다.", "확인");
    } catch (error) {
      showAlert("예약취소 실패", catchErrorMessage(error), "확인");
    }
  };

  const handleDeleteSelectedEpisodes = async () => {
    if (!selectedEpisodeIds.length) {
      showAlert("안내", "삭제할 회차를 먼저 선택해주세요.", "확인");
      return;
    }

    if (!deleteEligibleEpisodeIds.length) {
      showAlert("안내", "심사중인 회차는 삭제할 수 없습니다.", "확인");
      return;
    }

    const confirmResult = await confirm({
      title: "회차 삭제",
      text: `선택한 회차 ${deleteEligibleEpisodeIds.length}건을 삭제하시겠습니까?`,
      confirm: "삭제",
      cancel: "취소",
    });
    if (!confirmResult.isConfirmed) return;

    try {
      await deleteEpisodes.mutateAsync({ episode_ids: deleteEligibleEpisodeIds });
      await invalidateEpisodeQueries();
      setSelectedEpisodeIds([]);
      await showAlert("완료", "선택한 회차가 삭제되었습니다.", "확인");
    } catch (error) {
      showAlert("삭제 실패", catchErrorMessage(error), "확인");
    }
  };

  const pageTitleByProduct = useMemo(() => {
    if (!isViewMode) return "";
    const title = productDetail?.title || form.title || "작품명";
    const author = productDetail?.author_nickname || form.authorName || "작가명";
    return `${title} / ${author}`;
  }, [form.authorName, form.title, isViewMode, productDetail?.author_nickname, productDetail?.title]);

  const pageHeaderTitle = isViewMode ? pageTitleByProduct : isEditMode ? "작품 수정" : "작품 등록";
  const pageHeaderChild = isViewMode ? pageTitleByProduct : isEditMode ? "작품 수정" : "작품 등록";
  const sectionTitle = isViewMode ? "작품 및 회차목록" : isEditMode ? "작품 정보 수정" : "신규 작품 생성";
  const submitButtonText =
    isSubmitting || isCoverUploading
      ? isEditMode
        ? "수정 중..."
        : "생성 중..."
      : isEditMode
        ? "작품 수정"
        : "작품 생성";

  if (
    !isInitialized ||
    (isDetailMode &&
      (isProductDetailLoading ||
        isEpisodeSectionLoading ||
        isProductDetailFetching ||
        isEpisodeSectionFetching))
  ) {
    return <FullPageLoader isLoading={true} />;
  }

  if (isDetailMode && (isProductDetailError || !productDetail)) {
    return (
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="작품 상세" parent="작품 관리" child="작품 상세" />
        <div className="p-4">
          <div className="rounded-xl border border-[#E7E9EE] bg-white p-6 text-sm text-[#4A4F58]">
            작품 정보를 불러오지 못했습니다.
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

  if (!canManage) {
    return (
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title={pageHeaderTitle} parent="작품 관리" child={pageHeaderChild} />
        <div className="p-4">
          <div className="rounded-xl border border-[#E7E9EE] bg-white p-6 text-sm text-[#4A4F58]">
            관리자/출판사만 작품 등록/수정이 가능합니다.
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
      <PageHeader title={pageHeaderTitle} parent="작품 관리" child={pageHeaderChild} />

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="rounded-xl border border-[#E7E9EE] bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#171A1E]">{sectionTitle}</h2>
            {!isReadOnlyMode ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.push("/products")}>
                  취소
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || isCoverUploading}>
                  {submitButtonText}
                </Button>
              </div>
            ) : null}
          </div>

          <div className="relative grid gap-6 lg:grid-cols-[260px_1fr]">
            {isReadOnlyMode ? (
              <button
                type="button"
                className="absolute inset-0 z-20 cursor-not-allowed rounded-md bg-transparent"
                onClick={handleReadOnlyAttempt}
                aria-label="작품 정보 접기/펼치기"
              />
            ) : null}

            <fieldset disabled={isReadOnlyMode} className="contents">
              <div>
              <p className="mb-2 text-sm font-semibold text-[#1F2124]">커버 이미지</p>
              <div className="space-y-3">
                <div className="flex h-[360px] flex-col items-center justify-center rounded-md border border-dashed border-[#D5D9E3] bg-[#F8FAFF] p-4 text-center text-sm text-[#7A808C]">
                  {coverPreview ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={coverPreview}
                        alt="커버 미리보기"
                        fill
                        unoptimized
                        className="rounded-md object-cover"
                      />
                    </div>
                  ) : (
                    <>
                      <ImagePlus className="mb-2 h-8 w-8 text-[#6E7482]" />
                      <span>커버 이미지 미리보기</span>
                    </>
                  )}
                </div>

                <label className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-[#D5D9E3] bg-white text-sm font-medium text-[#1F2124] transition hover:bg-[#F8FAFF]">
                  {isCoverUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      업로드 중...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-4 w-4" />
                      커버 이미지 업로드                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUploadChange}
                    className="hidden"
                    disabled={isCoverUploading || isReadOnlyMode}
                  />
                </label>

                <p className="text-xs text-[#9AA0AD]">권장 400x600px</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">작품명{REQUIRED_MARK}</label>
                <Input
                  value={form.title}
                  placeholder="작품명을 입력해주세요."
                  onChange={(e) => setField("title", e.target.value)}
                />
              </div>

              {isFreeProduct ? (
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">연재 유형</label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="default" disabled>
                    {productType === "normal" ? "일반연재" : "자유연재"}
                  </Button>
                </div>
              </div>
              ) : (
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">
                  웹소설/단행본{REQUIRED_MARK}
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={form.publicationType === "serial" ? "default" : "outline"}
                    onClick={() => handlePublicationTypeChange("serial")}
                  >
                    웹소설
                  </Button>
                  <Button
                    type="button"
                    variant={form.publicationType === "volume" ? "default" : "outline"}
                    onClick={() => handlePublicationTypeChange("volume")}
                  >
                    단행본
                  </Button>
                </div>
              </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">작가명{REQUIRED_MARK}</label>
                <Input
                  value={form.authorName}
                  placeholder="작가명을 입력해주세요."
                  onChange={(e) => setField("authorName", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">연령등급{REQUIRED_MARK}</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={form.rating === "all" ? "default" : "outline"}
                    onClick={() => setField("rating", "all")}
                  >
                    전체
                  </Button>
                  <Button
                    type="button"
                    variant={form.rating === "19" ? "default" : "outline"}
                    onClick={() => setField("rating", "19")}
                  >
                    19세
                  </Button>
                </div>
              </div>

              {!isFreeProduct && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">작품종류{REQUIRED_MARK}</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={form.launchType === "promotion" ? "default" : "outline"}
                    onClick={() => setField("launchType", "promotion")}
                  >
                    프로모션런칭
                  </Button>
                  <Button
                    type="button"
                    variant={form.launchType === "normal" ? "default" : "outline"}
                    onClick={() => setField("launchType", "normal")}
                  >
                    일반런칭
                  </Button>
                </div>
              </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">1차 장르{REQUIRED_MARK}</label>
                <Select
                  value={form.primaryGenreId}
                  onValueChange={(value) => setField("primaryGenreId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="1차 장르 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {primaryGenres.map((genre) => (
                      <SelectItem key={genre.keyword_id} value={String(genre.keyword_id)}>
                        {genre.keyword_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">2차 장르</label>
                <Select
                  value={form.subGenreId || "none"}
                  onValueChange={(value) => setField("subGenreId", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="2차 장르 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안함</SelectItem>
                    {subGenres.map((genre) => (
                      <SelectItem key={genre.keyword_id} value={String(genre.keyword_id)}>
                        {genre.keyword_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.publicationType === "volume" && (
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">연재 상태{REQUIRED_MARK}</label>
                <div className="flex flex-wrap items-center gap-2">
                  {ONGOING_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={form.statusCode === option.value ? "default" : "outline"}
                      onClick={() => setField("statusCode", option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">독점 여부</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={form.monopolyYn ? "default" : "outline"}
                    onClick={() => setField("monopolyYn", true)}
                  >
                    독점
                  </Button>
                  <Button
                    type="button"
                    variant={!form.monopolyYn ? "default" : "outline"}
                    onClick={() => setField("monopolyYn", false)}
                  >
                    비독점
                  </Button>
                </div>
              </div>

              {!isFreeProduct && (
              <>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">UCI</label>
                <Input
                  value={form.uci}
                  placeholder="UCI 입력"
                  onChange={(e) => setField("uci", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">ISBN</label>
                <Input
                  value={form.isbn}
                  placeholder="ISBN 입력"
                  onChange={(e) => setField("isbn", e.target.value)}
                />
              </div>

              {form.publicationType === "serial" ? (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#1F2124]">연재 가격{REQUIRED_MARK}</label>
                  <Input
                    value={form.serialPrice}
                    placeholder="연재 가격"
                    readOnly
                    disabled
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#1F2124]">소장가격{REQUIRED_MARK}</label>
                    <Input
                      value={form.volumePrice}
                      placeholder="소장가격 입력"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (isPositiveIntegerInput(value)) setField("volumePrice", value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-[#1F2124]">대여가격{REQUIRED_MARK}</label>
                    <Input
                      value={form.volumeRentalPrice}
                      placeholder="대여가격 입력"
                      onChange={(e) => {
                        const value = e.target.value;
                        if (isPositiveIntegerInput(value)) setField("volumeRentalPrice", value);
                      }}
                    />
                  </div>
                </div>
              )}
              </>
              )}

              {isDetailMode && !isFreeProduct && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#1F2124]">무료회차 지정</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={form.freeEpisodeStartNo}
                      placeholder="시작"
                      maxLength={3}
                      className="w-[92px]"
                      readOnly={isReadOnlyMode}
                      disabled={isReadOnlyMode}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d{1,3}$/.test(value)) {
                          setField("freeEpisodeStartNo", value);
                        }
                      }}
                    />
                    <span className="text-sm text-[#6C7383]">~</span>
                    <Input
                      value={form.freeEpisodeEndNo}
                      placeholder="종료"
                      maxLength={3}
                      className="w-[92px]"
                      readOnly={isReadOnlyMode}
                      disabled={isReadOnlyMode}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d{1,3}$/.test(value)) {
                          setField("freeEpisodeEndNo", value);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {!isFreeProduct && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">CP명</label>
                <Select
                  value={form.cpCompanyName || "none"}
                  onValueChange={(value) => setField("cpCompanyName", value === "none" ? "" : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택 안함" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안함</SelectItem>
                    {cpCompanies?.map((cp) => (
                      <SelectItem key={cp.company_name} value={cp.company_name}>
                        {cp.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              )}

              {isEditMode && isAdmin && (
              <div className="md:col-span-2 flex flex-wrap items-center gap-6 pt-2">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-[#1F2124]">
                  <input
                    type="checkbox"
                    checked={form.blindYn}
                    onChange={(e) => setField("blindYn", e.target.checked)}
                  />
                  작품 블라인드
                </label>
              </div>
              )}

              {isEditMode && !isAdmin && form.blindYn && (
              <div className="md:col-span-2 rounded-md border border-[#F3C4C4] bg-[#FFF6F6] px-4 py-3 text-sm text-[#B42318]">
                관리자 블라인드된 작품입니다. 사용자에게 노출되지 않으며 해제는 관리자만 가능합니다.
              </div>
              )}

              {isFreeProduct && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">(예정)유료전환 시작 회차</label>
                <Input
                  value={productDetail?.paid_episode_no ? String(productDetail.paid_episode_no) : "-"}
                  readOnly
                  disabled
                />
              </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-[#1F2124]">작품 소개{REQUIRED_MARK}</label>
                <textarea
                  value={form.synopsis}
                  onChange={(e) => setField("synopsis", e.target.value)}
                  placeholder="작품 소개를 입력해주세요."
                  maxLength={800}
                  className="h-[180px] w-full resize-none rounded-md border border-[#DCDCE4] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4C63FF]"
                />
                <p className="mt-1 text-right text-xs text-[#8A909C]">{form.synopsis.length} / 800</p>
              </div>
            </div>
            </fieldset>
          </div>

          <div className="mt-6 flex items-center justify-start">
            <Button variant="outline" onClick={() => router.push("/products")}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              작품 리스트로 이동
            </Button>
          </div>
        </div>

        {isDetailMode ? (
          <>
            <div className="rounded-xl border border-[#E7E9EE] bg-white p-6">
              <h3 className="text-lg font-semibold text-[#1F2124]">회차 현황</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-[#E7E9EE] bg-[#F9FAFC] p-4">
                  <p className="text-sm text-[#6C7383]">최종등록 회차 </p>
                  <p className="mt-1 text-2xl font-semibold text-[#1F2124]">{totalEpisodeCount}건</p>
                </div>
                <div className="rounded-lg border border-[#E7E9EE] bg-[#F9FAFC] p-4">
                  <p className="text-sm text-[#6C7383]">판매중인 회차 </p>
                  <p className="mt-1 text-2xl font-semibold text-[#1F2124]">{sellingEpisodeCount}건</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E7E9EE] bg-white p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-[#1F2124]">유료작품 회차등록 및 판매일정 지정</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled>
                    순서변경                  </Button>
                  <Button variant="outline" disabled>
                    20개 보기
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/products/upload/episodes?productId=${editProductId}`)}
                  >
                    회차추가
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-[#E7E9EE]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[48px]">
                        <input
                          type="checkbox"
                          checked={allEpisodeSelected}
                          onChange={toggleSelectAllEpisodes}
                          disabled={!episodes.length || isActionPending}
                          aria-label="회차 전체 선택"
                        />
                      </TableHead>
                      <TableHead>순서</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>회차제목</TableHead>
                      <TableHead>유무</TableHead>
                      <TableHead>버전</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>뷰어종류</TableHead>
                      <TableHead>발행?</TableHead>
                      <TableHead>분량</TableHead>
                      <TableHead>메모</TableHead>
                      <TableHead>미리보기</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {episodes.length ? (
                      episodes.map((episode, index) => {
                        return (
                        <TableRow key={episode.episodeId}>
                          <TableCell>
                            <input
                              type="checkbox"
                              disabled={isActionPending}
                              checked={selectedEpisodeIds.includes(episode.episodeId)}
                              onChange={() => toggleEpisodeSelection(episode.episodeId)}
                              aria-label={`회차 ${episode.episodeId} 선택`}
                            />
                          </TableCell>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{episode.episodeId}</TableCell>
                          <TableCell>{episode.episodeTitle || "-"}</TableCell>
                          <TableCell>
                            {episode.priceType === "paid"
                              ? "완료"
                              : episode.priceType === "free"
                                ? "무료"
                                : "-"}
                          </TableCell>
                          <TableCell>{Math.max(1, Number(episode.episodeVersion ?? 1))}</TableCell>
                          <TableCell>{getEpisodeStatusLabel(episode)}</TableCell>
                          <TableCell>EPUB 뷰어</TableCell>
                          <TableCell>
                            {formatEpisodeDate(episode.publishReserveDate ?? episode.createdDate)}
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            {episode.epubFilePath ? (
                              <div className="flex items-center gap-1">
                                <a
                                  href={episode.epubFilePath}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-7 items-center rounded border border-[#D6DAE4] px-2 text-xs"
                                >
                                  보기
                                </a>
                                <a
                                  href={episode.epubFilePath}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex h-7 items-center rounded border border-[#D6DAE4] px-2 text-xs"
                                >
                                  다운로드
                                </a>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={12} className="py-10 text-center text-[#7F8796]">
                          등록된 회차가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E7E9EE] bg-[#FBFCFF] p-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDeleteSelectedEpisodes}
                    disabled={!selectedEpisodeIds.length || isActionPending}
                  >
                    {isDeletingEpisodes ? "처리 중..." : "삭제"}
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRequestSelectedReviews}
                    disabled={!selectedEpisodeIds.length || isActionPending}
                  >
                    {isApplyingReview ? "처리 중..." : "심사신청"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelSelectedReviews}
                    disabled={!selectedEpisodeIds.length || isActionPending}
                  >
                    {isCancellingReview ? "처리 중..." : "심사신청 취소"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleStartSale}
                    disabled={!selectedEpisodeIds.length || isActionPending}
                  >
                    {isStartingSale ? "처리 중..." : "판매시작"}
                  </Button>
                  <Input
                    type="datetime-local"
                    className="w-[210px]"
                    value={reserveDateTime}
                    onChange={(e) => setReserveDateTime(e.target.value)}
                    disabled={isActionPending}
                  />
                  <Button
                    variant="outline"
                    onClick={handleReserveSale}
                    disabled={!selectedEpisodeIds.length || isActionPending}
                  >
                    {isReservingSale ? "처리 중..." : "판매예약"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelReserveSale}
                    disabled={!selectedEpisodeIds.length || isActionPending}
                  >
                    {isCancellingReserve ? "처리 중..." : "예약취소"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <FullPageLoader
        isLoading={isSubmitting || isCoverUploading || isActionPending}
      />
    </SidebarInset>
  );
}


