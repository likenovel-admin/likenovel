"use client";
import {
  useCanCreateNormal,
  useMakeProduct,
  useSelectEpisodeCount,
  useSelectGenres,
  useSelectMakingProduct,
  useUpdateProduct,
  useValidateCpNickname,
} from "@/app/api/query/author/product";
import {
  IMakeProductRequest,
  ISelectMakingProductResponse,
  IUpdateProductRequest,
} from "@/app/api/query/author/product/dto";
import { useSelectUserInfo } from "@/app/api/query/mypage/user";
import NewDirectInputSearchTag from "@/components/makingProduct/NewDirectInputSearchTag";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { getUser } from "@/utils/getUser";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import Checkbox from "../common/CheckBox";
import ExclamationTooltip, {
  ClickExclamationTooltip,
} from "../common/ExclamationTooltip";
import Modal from "../common/Modal";
import Spinner from "../common/Spinner";
import CheckboxGroup from "../form/checkbox/CheckboxGroup";
import DatePicker from "../form/datepicker";
import Input from "../form/input";
import SelectBox from "../form/selectbox";
import Toggle from "../form/toggle";
import TextArea from "../form/textarea";
import TermsOfUseModal from "../modal/TermsOfUseModal";
import BaseSearchTag from "./BaseSearchTag";
import BottomButton from "./BottomButton";
import PhotoArea from "./PhotoArea";
import StoppedTooltip from "./StoppedTooltip";
dayjs.extend(utc);

const NEXT_PAID_START_CHAPTER_VALUE = -1;

export interface IMakeProductForm {
  ongoingState: "ongoing" | "end" | "stop" | "rest";
  title: string;
  authorNickname: string;
  illustratorNickname: string;
  updateFrequency: (
    | "mon"
    | "tue"
    | "wed"
    | "thu"
    | "fri"
    | "sat"
    | "sun"
    | "irregular"
  )[];
  primaryGenre: string;
  subGenre: string;
  synopsis: string;
  storyAgentSetting: string;
  ageGrade: "all" | "under18";
  open: "Y" | "N";
  monopoly: "Y" | "N";
  contract: "Y" | "N";
  cpNickname: string;
  paidStartChapterDate: Date | null;
  paidStartChapter: number;
  agree: boolean;
  baseTag?: { value: string; label: string }[];
  directTag?: { value: string; label: string }[];
  productType: "normal" | "";
}

interface IOriginProduct extends IMakeProductForm {
  coverImagePath: string;
  priceType: "free" | "paid";
  paidApprovedYn?: "Y" | "N";
  paidApplyStatus?: "review" | "accepted" | "denied" | null;
  publishRegularYn: "Y" | "N";
  paidEpisodeNo?: number | null;
  paidSettingDate?: Date | null;
}

interface Props {
  productId?: number;
}

const FormArea = ({ productId }: Props) => {
  const { setModal } = useModalStore();
  const currentUser = getUser();

  const { mutateAsync: selectEpisodeCount, data: episodeCount } =
    useSelectEpisodeCount();
  const { mutateAsync: validateCpNickname, isPending: isValidatingCpNickname } =
    useValidateCpNickname();
  const { mutate: makeProduct } = useMakeProduct();
  const {
    mutateAsync: selectProduct,
    data,
    isPending,
  } = useSelectMakingProduct();
  const { mutate: updateProduct } = useUpdateProduct();
  const { data: genresData } = useSelectGenres();
  const { data: userInfo } = useSelectUserInfo(currentUser?.userId ?? 0);
  const { data: canCreateNormalData } = useCanCreateNormal(
    !productId && !!currentUser
  );
  const canCreateNormal = canCreateNormalData?.can_create_normal ?? false;
  const genreOptions = genresData?.data?.map((genre) => genre.genre) ?? [];

  const methods = useForm<IMakeProductForm>({
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: async () => {
      let defaultData = [] as any;
      let originData = {} as any;

      if (productId) {
        await selectEpisodeCount(productId);
        defaultData = await selectProduct(productId as number);
        originData = getDefaultValues(defaultData);
      }
      return {
        ongoingState: productId ? originData.ongoingState : "ongoing",
        title: productId ? originData.title : "",
        authorNickname: productId
          ? originData.authorNickname
          : userInfo?.data?.userNickname || "",
        illustratorNickname: productId ? originData.illustratorNickname : "",
        updateFrequency: productId ? originData.updateFrequency : ["mon", "tue", "wed", "thu", "fri"],
        primaryGenre: productId ? originData.primaryGenre || "" : "무협",
        subGenre: productId ? originData.subGenre : "",
        synopsis: productId ? originData.synopsis : "",
        storyAgentSetting: productId ? originData.storyAgentSetting : "",
        ageGrade: productId ? originData.ageGrade : "all",
        open: productId ? originData.open : "Y",
        monopoly: productId ? originData.monopoly : "Y",
        contract: productId ? originData.contract : "N",
        cpNickname: productId ? originData.cpNickname : "",
        paidStartChapterDate:
          productId &&
          (defaultData?.data.priceType === "paid" ||
            defaultData?.data.paidApprovedYn === "Y")
            ? originData.paidStartChapterDate ?? null
            : null,
        paidStartChapter: productId ? originData.paidStartChapter || 1 : 1,
        agree: false,
        baseTag: productId ? originData.baseTag : [],
        directTag: productId ? originData.directTag : [],
        productType: productId ? (originData.productType || "") : "",
      };
    },
  });

  const {
    handleSubmit,
    register,
    control,
    setValue,
    setError,
    clearErrors,
    watch,
    formState,
  } = methods;
  const { setToast } = useToastStore();
  const { setConfirm } = useConfirmStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(false);
  const [usePaidStartDate, setUsePaidStartDate] = useState(true);
  const isPaidProduct = Boolean(productId && data?.data.priceType === "paid");
  const isPaidSettingEnabled = Boolean(
    productId &&
      (data?.data.priceType === "paid" || data?.data.paidApprovedYn === "Y")
  );
  const shouldIncludePaidFieldsOnUpdate = Boolean(
    productId &&
      (data?.data.priceType === "paid" ||
        data?.data.paidApprovedYn === "Y" ||
        data?.data.paidApplyStatus === "accepted")
  );
  const isContractLocked = Boolean(
    productId &&
      (data?.data.priceType === "paid" ||
        data?.data.paidApplyStatus === "review" ||
        data?.data.paidApplyStatus === "accepted")
  );
  const isPaidConversionLocked = isPaidProduct;
  const paidStartChapter = watch("paidStartChapter");
  const paidStartChapterDate = watch("paidStartChapterDate");
  const primaryGenreValue = watch("primaryGenre");
  const monopolyValue = watch("monopoly");
  const contractValue = watch("contract");
  const cpNicknameValue = watch("cpNickname");
  const subGenreOptions = genreOptions.filter(
    (genre) => genre !== primaryGenreValue
  );
  const isMonopolyLocked = Boolean(productId);
  const episodeTotalCount = episodeCount?.data?.hasEpisodeCount ?? 0;
  const nextPaidStartChapterNo = episodeTotalCount + 1;
  const selectPaidStartChapterValue =
    paidStartChapter === nextPaidStartChapterNo
      ? String(NEXT_PAID_START_CHAPTER_VALUE)
      : String(paidStartChapter || "1");
  const resolvedPaidStartChapter =
    paidStartChapter === NEXT_PAID_START_CHAPTER_VALUE
      ? nextPaidStartChapterNo
      : paidStartChapter || 1;
  const paidStartChapterOptions =
    episodeTotalCount >= 1
      ? [
          ...Array.from({ length: episodeTotalCount }, (_, index) => ({
            label: `${index + 1}회`,
            value: `${index + 1}`,
          })),
          {
            label: "다음회차부터",
            value: String(NEXT_PAID_START_CHAPTER_VALUE),
          },
        ]
      : [
          {
            label: "다음회차부터",
            value: String(NEXT_PAID_START_CHAPTER_VALUE),
          },
        ];
  const paidStartGuideDateText =
    usePaidStartDate && paidStartChapterDate
      ? dayjs(paidStartChapterDate).format("YYYY-MM-DD HH:mm")
      : "즉시";
  const [cpValidation, setCpValidation] = useState<{
    valid: boolean | null;
    message: string;
  }>({
    valid: null,
    message: "",
  });

  // Set authorNickname from userInfo when it loads (for new product only)
  useEffect(() => {
    if (!productId && userInfo?.data?.userNickname) {
      const currentAuthorNickname = watch("authorNickname");
      if (!currentAuthorNickname) {
        setValue("authorNickname", userInfo.data.userNickname, {
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    }
  }, [userInfo, productId, setValue, watch]);

  // Set productType default to "normal" when qualification data loads (new product only)
  useEffect(() => {
    if (!productId && canCreateNormal) {
      setValue("productType", "normal", {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [canCreateNormal, productId, setValue]);

  useEffect(() => {
    if (productId && data?.data) {
      setUsePaidStartDate(Boolean(data.data.paidSettingDate));
    }
  }, [productId, data?.data?.paidSettingDate]);

  useEffect(() => {
    if (monopolyValue !== "Y") {
      setValue("contract", "N", {
        shouldDirty: false,
        shouldTouch: false,
      });
      setValue("cpNickname", "", {
        shouldDirty: false,
        shouldTouch: false,
      });
      clearErrors("cpNickname");
      setCpValidation({ valid: null, message: "" });
    }
  }, [clearErrors, monopolyValue, setValue]);

  useEffect(() => {
    if (contractValue !== "Y") {
      clearErrors("cpNickname");
      setCpValidation({ valid: null, message: "" });
      return;
    }

    if (cpNicknameValue) {
      setCpValidation({ valid: null, message: "" });
    }
  }, [clearErrors, contractValue, cpNicknameValue]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formState.isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formState.isDirty, isSubmitting]);

  // Handle browser back button
  useEffect(() => {
    if (formState.isDirty && !isSubmitting) {
      // Add a dummy history state to intercept back button
      window.history.pushState(null, "", window.location.href);

      const handlePopState = (e: PopStateEvent) => {
        if (formState.isDirty && !isSubmitting) {
          // Push state again to prevent navigation
          window.history.pushState(null, "", window.location.href);

          // Show confirmation modal
          setConfirm({
            content: (
              <div>
                <p>저장하지 않은 정보가 있습니다</p>
                <p>페이지를 나가시겠습니까?</p>
              </div>
            ),
            buttonCount: 2,
            onConfirm: () => {
              // Allow navigation by going back
              setShouldBlockNavigation(false);
              const route = productId
                ? `/product/author/episode-manager/${productId}`
                : "/product/author";
              router.push(route);
            },
          });
        }
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [formState.isDirty, productId, isSubmitting, setConfirm]);

  const getDefaultValues = (data: ISelectMakingProductResponse) => {
    const defaultValues = {
      ongoingState:
        (data?.data.ongoingState as
          | "ongoing"
          | "end"
          | "stop"
          | "rest"
          | "irregular") || "ongoing",
      title: data?.data.title || "",
      authorNickname: data?.data.authorNickname || "",
      illustratorNickname: data?.data.illustratorNickname || "",
      updateFrequency:
        data?.data.publishRegularYn === "N"
          ? data?.data.updateFrequency.includes("irregular" as any)
            ? data?.data.updateFrequency
            : [...data?.data.updateFrequency, "irregular"]
          : data?.data.updateFrequency || ["mon"],
      primaryGenre: data?.data.primaryGenre || "",
      subGenre: data?.data.subGenre || "",
      synopsis: data?.data.synopsis || "",
      storyAgentSetting: data?.data.storyAgentSetting || "",
      ageGrade: data?.data.adultYn === "N" ? "all" : ("under18" as const),
      open: data?.data.openYn || "Y",
      monopoly: data?.data.monopolyYn || "N",
      contract: data?.data.cpContractYn || "N",
      cpNickname: data?.data.cpNickname || "",
      paidStartChapterDate: data?.data?.paidSettingDate
        ? new Date(data.data.paidSettingDate)
        : dayjs()
            .add(1, "day")
            .hour(12)
            .minute(0)
            .second(0)
            .millisecond(0)
            .toDate(),
      paidStartChapter: data?.data?.paidEpisodeNo || 1,
      agree: false,
      baseTag:
        data?.data.keywords?.map((item) => ({ value: item, label: item })) ||
        [],
      directTag:
        data?.data.customKeywords?.map((item) => ({
          value: item,
          label: item,
        })) || [],
      coverImagePath: data?.data.coverImagePath || "",
      priceType: data?.data.priceType || "free",
      paidApprovedYn: data?.data.paidApprovedYn || "N",
      paidApplyStatus: data?.data.paidApplyStatus || null,
      publishRegularYn: data?.data.publishRegularYn || "Y",
      productType: data?.data.productType === "normal" ? "normal" : "",
    };
    return defaultValues;
  };

  // 이미지 파일 아이디
  const [fileId, setFileId] = useState<number | null>(null);
  const [isCoverUploading, setIsCoverUploading] = useState(false);

  const handleFileId = (newFileId: number) => {
    setFileId(newFileId);
  };

  const validateLinkedCpNickname = async (nickname: string) => {
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setCpValidation({
        valid: false,
        message: "CP 닉네임을 입력해주세요.",
      });
      setError("cpNickname", {
        type: "manual",
        message: "CP 닉네임을 입력해주세요.",
      });
      return false;
    }

    try {
      const response = await validateCpNickname(trimmedNickname);
      if (!response.data.valid) {
        setCpValidation({
          valid: false,
          message: "유효한 CP 닉네임을 확인할 수 없습니다.",
        });
        setError("cpNickname", {
          type: "manual",
          message: "유효한 CP 닉네임을 확인할 수 없습니다.",
        });
        return false;
      }

      setValue("cpNickname", trimmedNickname, {
        shouldDirty: true,
        shouldTouch: true,
      });
      clearErrors("cpNickname");
      setCpValidation({
        valid: true,
        message: "유효한 CP가 확인되었습니다.",
      });
      return true;
    } catch {
      setCpValidation({
        valid: false,
        message: "유효한 CP 닉네임을 확인할 수 없습니다.",
      });
      setError("cpNickname", {
        type: "manual",
        message: "유효한 CP 닉네임을 확인할 수 없습니다.",
      });
      return false;
    }
  };

  const handleCpNicknameBlur = async () => {
    if (contractValue !== "Y" || isContractLocked) {
      return;
    }
    await validateLinkedCpNickname(watch("cpNickname") || "");
  };

  const onSubmit = async (data: IMakeProductForm) => {
    if (!data.agree) {
      return;
    }
    if (data.monopoly === "Y" && data.contract === "Y" && !isContractLocked) {
      const isValidCpNickname = await validateLinkedCpNickname(data.cpNickname);
      if (!isValidCpNickname) {
        setIsSubmitting(false);
        return;
      }
    }
    if (isCoverUploading) {
      setToast({
        message: "표지 업로드가 끝난 뒤 등록해주세요.",
        type: "error",
      });
      return;
    }
    setIsSubmitting(true);
    if (productId) {
      const requestData: any = transformFormDataToRequestData(data);
      if (shouldIncludePaidFieldsOnUpdate) {
        // Keep paid metadata only when the product is already in a paid flow.
        const paidDate = data.paidStartChapterDate
          ? data.paidStartChapterDate
          : dayjs()
              .add(1, "day")
              .hour(12)
              .minute(0)
              .second(0)
              .millisecond(0)
              .toDate();
        requestData.paid_setting_date = dayjs.utc(paidDate).format();
        requestData.paid_episode_no =
          data.paidStartChapter === NEXT_PAID_START_CHAPTER_VALUE
            ? nextPaidStartChapterNo
            : data.paidStartChapter || 1;
      }
      updateProduct(
        { productId, data: requestData },
        {
          onSuccess: () => {
            setToast({
              message: "작품이 수정되었습니다",
              type: "success",
            });
            setIsSubmitting(false);
            // Use window.location.href to bypass history manipulation
            window.location.href = `/product/author/episode-manager/${productId}`;
          },
          onError: (error: any) => {
            setIsSubmitting(false);
            setToast({
              message:
                error?.response?.data?.message || "작품 수정에 실패했습니다.",
              type: "error",
            });
          },
        }
      );
    } else {
      const requestData = transformFormDataToRequestData(data);
      makeProduct(requestData, {
        onSuccess: () => {
          setToast({
            message: "작품이 등록되었습니다",
            type: "success",
          });
          setIsSubmitting(false);
          // Use window.location.href to bypass history manipulation
          window.location.href = "/product/author";
        },
        onError: (error: any) => {
          setIsSubmitting(false);
          setToast({
            message:
              error?.response?.data?.message || "작품 등록에 실패했습니다.",
            type: "error",
          });
        },
      });
    }
  };
  const onError = (errors: any) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 1 && errorKeys.includes("agree")) {
      setConfirm({
        content: "이용약관에 동의해주세요.",
        buttonCount: 1,
      });
    } else {
      setToast({
        message: "필수 입력값을 확인해주세요.",
        type: "error",
      });
    }
  };

  const transformFormDataToRequestData = (
    formData: IMakeProductForm
  ): IMakeProductRequest | IUpdateProductRequest => {
    const keywords =
      formData?.baseTag?.map((item) => item.value).filter(Boolean) || [];
    const customKeywords =
      formData?.directTag?.map((item) => item.value).filter(Boolean) || [];

    const requestData: IMakeProductRequest | IUpdateProductRequest = {
      cover_image_file_id: fileId,
      ongoing_state: formData.ongoingState,
      title: formData.title,
      author_nickname: formData.authorNickname,
      illustrator_nickname: formData.illustratorNickname || null,
      update_frequency: (
        formData.updateFrequency as (
          | "mon"
          | "tue"
          | "wed"
          | "thu"
          | "fri"
          | "sat"
          | "sun"
          | "irregular"
        )[]
      ).filter((day) => day !== "irregular"),
      publish_regular_yn: formData.updateFrequency.includes("irregular")
        ? "N"
        : "Y",
      primary_genre: formData.primaryGenre,
      sub_genre: formData.subGenre || null,
      keywords: keywords.length > 0 ? keywords : null,
      custom_keywords: customKeywords.length > 0 ? customKeywords : null,
      synopsis: formData.synopsis,
      adult_yn: formData.ageGrade === "all" ? "N" : "Y",
      open_yn:
        data?.data.blindYn === "Y" ? (data?.data.openYn ?? "N") : formData.open,
      monopoly_yn: formData.monopoly,
      cp_contract_yn: formData.monopoly === "Y" ? formData.contract : "N",
      cp_nickname:
        formData.monopoly === "Y" && formData.contract === "Y"
          ? formData.cpNickname.trim() || null
          : null,
      product_type: formData.productType === "normal" ? "normal" : null,
    };

    if (productId && data?.data.priceType === "free") {
      (requestData as IUpdateProductRequest).story_agent_setting =
        formData.storyAgentSetting.trim() || null;
    }

    if (productId && shouldIncludePaidFieldsOnUpdate) {
      if (isPaidConversionLocked) {
        (requestData as IUpdateProductRequest).paid_setting_date =
          data?.data?.paidSettingDate
            ? new Date(dayjs.utc(data.data.paidSettingDate).format())
            : null;
        (requestData as IUpdateProductRequest).paid_episode_no =
          data?.data?.paidEpisodeNo || 0;
      } else {
        const effectivePaidSettingDate = usePaidStartDate
          ? formData.paidStartChapterDate
            ? new Date(dayjs.utc(formData.paidStartChapterDate).format())
            : null
          : new Date(dayjs.utc().format());
        (requestData as IUpdateProductRequest).paid_setting_date =
          effectivePaidSettingDate;
        (requestData as IUpdateProductRequest).paid_episode_no =
          formData.paidStartChapter === NEXT_PAID_START_CHAPTER_VALUE
            ? nextPaidStartChapterNo
            : formData.paidStartChapter || 1;
      }
    }
    return requestData;
  };

  const handleOpenTermsOfUse = () => {
    setModal(<TermsOfUseModal />);
  };

  const labelClassName =
    "text-13pxr md:text-16pxr text-dark-gray-500 font-semibold mb-10pxr";
  const requiredLabelClassName = `${labelClassName} after:content-['*'] after:text-red-100`;
  const inputTextClassName =
    "text-14pxr md:text-16pxr h-40pxr md:h-44pxr text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] pl-9pxr pr-11pxr";

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <div className="md:flex md:mt-[50px] mt-[28px] pb-20pxr md:bg-white md:rounded-[10px] md:pr-35pxr">
          {isPending ? (
            <div className="w-full h-screen flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <>
              <PhotoArea
                onFileId={handleFileId}
                imagePath={data?.data.coverImagePath}
                onUploadingChange={setIsCoverUploading}
              />
              <div className="hidden md:block w-[1px] border border-l-light-gray-200 border-r-0 border-t-0 border-b-0 mr-[30px] mt-[40px]" />
              <section className="flex flex-col bg-white mt-8pxr pt-32pxr pb-17pxr px-16pxr gap-33pxr md:flex-1 md:pl-0">
                <Controller
                  name={"ongoingState"}
                  control={control}
                  rules={{
                    required: "연재상태를 선택해주세요.",
                  }}
                  render={({ field }) => (
                    <Input
                      label={
                        <div className="flex gap-1 mb-2 items-center">
                          <span
                            className={
                              "text-13pxr md:text-16pxr text-dark-gray-500 after:content-['*'] after:text-red-100 font-semibold"
                            }
                          >
                            연재상태
                          </span>
                          <ExclamationTooltip message="연재 상태는 작품의 진행 여부를 의미합니다. 완결/휴재/중지 상태는 노출과 운영 가능 범위에 영향을 줄 수 있으니 현재 상태에 맞게 선택해 주세요." />
                        </div>
                      }
                      optionsStyle="peer-checked:border-primary-100 w-auto h-[46px] md:h-[50px] px-14pxr flex items-center justify-center gap-[7px] border border-light-gray-500 rounded-md cursor-pointer"
                      activeOptionStyle="border-primary-100"
                      options={[
                        {
                          label: "연재중",
                          value: "ongoing",
                        },
                        {
                          label: "휴재 중",
                          value: "rest",
                        },
                        {
                          label: "완결",
                          value: "end",
                        },
                        {
                          label: (
                            <div className="flex gap-1 items-center">
                              <span>연재 중지</span>
                              <StoppedTooltip message="더이상 연재가 어려울 경우, 반드시 선택해주세요. 단, 연재중지되면 작품이 구좌 등에 노출되지 않습니다." />
                            </div>
                          ),
                          value: "stop",
                        },
                      ]}
                      {...field}
                      checkedValue={field.value}
                    />
                  )}
                />
                {(canCreateNormal || productId) && (
                  <Controller
                    name="productType"
                    control={control}
                    render={({ field }) => (
                      <SelectBox
                        label="연재 유형"
                        labelClassName={labelClassName}
                        options={[
                          { label: "자유연재", value: "" },
                          { label: "일반연재", value: "normal" },
                        ]}
                        value={field.value || ""}
                        onChange={field.onChange}
                        ref={field.ref}
                        disabled={!!productId}
                      />
                    )}
                  />
                )}
                <Input
                  label="제목"
                  labelStyle={requiredLabelClassName}
                  placeholder="작품 제목을 입력하세요"
                  inputStyle={inputTextClassName}
                  maxLength={30}
                  {...register("title", { required: "제목을 입력해주세요." })}
                  additionalText={
                    <span className="text-black-100 text-11pxr mr-3">
                      {watch("title")?.length || 0}
                      <span className="text-dark-gray-100">{` / 30자`}</span>
                    </span>
                  }
                />

                {/* <div className={"flex gap-2 w-full"}> */}
                <Input
                  label="작가명"
                  labelStyle={requiredLabelClassName}
                  placeholder="작가명을 입력하세요"
                  inputStyle={`${inputTextClassName} bg-light-gray-100 cursor-not-allowed`}
                  disabled={true}
                  {...register("authorNickname", {
                    required: "작가명을 입력해주세요.",
                  })}
                />
                {/* <Input
                    label="그림 작가명"
                    labelStyle={labelClassName}
                    full
                    placeholder="그림 작가명 입력하세요"
                    inputStyle={inputTextClassName}
                    {...register("illustratorNickname")}
                  />
                </div> */}

                <Controller
                  name="updateFrequency"
                  control={control}
                  rules={{
                    required:
                      "목표연재주기(권장 주5회)를 최소 1개 이상 선택해주세요.",
                  }}
                  render={({ field }) => (
                    <CheckboxGroup
                      label={
                        <div className="flex gap-2 mb-2 items-center">
                          <span
                            className={
                              "text-13pxr md:text-16pxr text-dark-gray-500 after:content-['*'] after:text-red-100 font-semibold"
                            }
                          >
                            목표연재주기(권장 주5회)
                          </span>
                          <span className={"text-13pxr text-dark-gray-300"}>
                            {field.value?.includes("irregular")
                              ? "비정기 연재입니다."
                              : "중복선택 가능합니다."}
                          </span>
                        </div>
                      }
                      onChange={(selectedValues) => {
                        const previousValue = field.value ?? [];
                        const hasIrregular =
                          selectedValues.includes("irregular");
                        const hadIrregular =
                          previousValue.includes("irregular");

                        // If user just selected "irregular" (wasn't selected before)
                        if (hasIrregular && !hadIrregular) {
                          // Only keep "irregular", remove all other days
                          field.onChange(["irregular"]);
                        }
                        // If user selected a day when "irregular" was already selected
                        else if (
                          hasIrregular &&
                          hadIrregular &&
                          selectedValues.length > 1
                        ) {
                          // Remove "irregular", keep only the newly selected days
                          field.onChange(
                            selectedValues.filter((v) => v !== "irregular")
                          );
                        }
                        // Normal case: no irregular involved or user unselected irregular
                        else {
                          field.onChange(selectedValues);
                        }
                      }}
                      selectedValues={field.value ?? []}
                      options={[
                        {
                          label: "월",
                          value: "mon",
                        },
                        {
                          label: "화",
                          value: "tue",
                        },
                        {
                          label: "수",
                          value: "wed",
                        },
                        {
                          label: "목",
                          value: "thu",
                        },
                        {
                          label: "금",
                          value: "fri",
                        },
                        {
                          label: "토",
                          value: "sat",
                        },
                        {
                          label: "일",
                          value: "sun",
                        },
                        {
                          label: "비정기",
                          value: "irregular",
                        },
                      ]}
                    />
                  )}
                />
                <div className={"flex gap-2 w-full"}>
                  <Controller
                    name="primaryGenre"
                    rules={{
                      required: "1차 장르를 선택해주세요.",
                    }}
                    control={control}
                    render={({ field }) => (
                      <SelectBox
                        label="1차 장르"
                        full
                        labelClassName={
                          labelClassName +
                          " after:content-['*'] after:text-red-100 font-semibold"
                        }
                        options={[
                          {
                            label: "1차 장르 선택",
                            value: "",
                            disabled: true,
                          },
                          ...genreOptions.map((g) => ({
                            label: g,
                            value: g,
                          })),
                        ]}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e);
                          if (watch("subGenre") === e.target.value) {
                            setValue("subGenre", "");
                          }
                        }}
                        ref={field.ref}
                      />
                    )}
                  />
                  <Controller
                    name="subGenre"
                    control={control}
                    render={({ field }) => (
                      <SelectBox
                        label="2차 장르"
                        full
                        labelClassName={labelClassName}
                        options={[
                          {
                            label: "선택 안함",
                            value: "",
                          },
                          ...subGenreOptions.map((g) => ({
                            label: g,
                            value: g,
                          })),
                        ]}
                        value={field.value || ""}
                        onChange={field.onChange}
                        ref={field.ref}
                      />
                    )}
                  />
                </div>
                <BaseSearchTag />
                {/* <DirectSearchTag /> */}
                <NewDirectInputSearchTag />
                <TextArea
                  {...register("synopsis", {
                    required: "작품소개를 입력해주세요.",
                  })}
                  label="작품 소개"
                  labelStyle={requiredLabelClassName}
                  placeholder={"내용을 입력하세요"}
                  inputStyle={
                    "text-14pxr md:text-16pxr h-[212px] text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%]"
                  }
                  maxLength={800}
                  additionalText={
                    <div className="text-black-100 text-11pxr bg-white pl-1 h-full mr-3">
                      {watch("synopsis")?.length || 0}
                      <span className="text-dark-gray-100">{` / 800자`}</span>
                    </div>
                  }
                />
                {productId && data?.data.priceType === "free" && (
                  <TextArea
                    {...register("storyAgentSetting")}
                    label="스토리 에이전트 보조 설정"
                    labelStyle={labelClassName}
                    placeholder={"캐릭터, 세계관, 전력 비교, IF 전개에 필요한 보조 설정을 입력하세요. 원문이 우선됩니다."}
                    inputStyle={
                      "text-14pxr md:text-16pxr h-[212px] text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%]"
                    }
                    maxLength={1000}
                    additionalText={
                      <div className="text-black-100 text-11pxr bg-white pl-1 h-full mr-3">
                        {watch("storyAgentSetting")?.length || 0}
                        <span className="text-dark-gray-100">{` / 1000자`}</span>
                      </div>
                    }
                    successText={
                      <div className="text-dark-gray-300 text-11pxr mt-2">
                        선택 입력입니다. 캐릭터, 세계관, 전력 비교, IF 질문에서만 스토리 에이전트가 보조 설정으로 참고합니다.
                      </div>
                    }
                  />
                )}
                <Controller
                  name={"ageGrade"}
                  control={control}
                  rules={{
                    required: "연령등급을 선택해주세요.",
                  }}
                  render={({ field }) => (
                    <Input
                      label={"연령등급"}
                      labelStyle={requiredLabelClassName}
                      optionsStyle="peer-checked:border-primary-100 w-auto h-[46px] md:h-[50px] px-14pxr flex items-center justify-center gap-[7px] border border-light-gray-500 rounded-md cursor-pointer"
                      activeOptionStyle="border-primary-100"
                      options={[
                        {
                          label: "전체이용가",
                          value: "all",
                        },
                        {
                          label: "18세 미만 이용불가",
                          value: "under18",
                        },
                      ]}
                      {...field}
                      checkedValue={field.value}
                      successText={
                        <div className="text-dark-gray-300 text-[13px] mt-2">
                          등록 후에는 변경할 수 없으니 신중하게 선택해 주세요.
                        </div>
                      }
                      hasSuccessIcon={false}
                    />
                  )}
                />
                {data?.data.blindYn === "Y" ? (
                  <div>
                    <p className={`${requiredLabelClassName} mb-2`}>공개 설정</p>
                    <p className="text-sm text-[#E54949]">관리자 블라인드된 작품입니다. 사용자에게 노출되지 않습니다.</p>
                  </div>
                ) : (
                  <Controller
                    name={"open"}
                    control={control}
                    rules={{
                      required: "공개 설정을 선택해주세요.",
                    }}
                    render={({ field }) => (
                      <Input
                        label={"공개 설정"}
                        labelStyle={requiredLabelClassName}
                        optionsStyle="peer-checked:border-primary-100 w-auto h-[46px] md:h-[50px] px-14pxr flex items-center justify-center gap-[7px] border border-light-gray-500 rounded-md cursor-pointer"
                        activeOptionStyle="border-primary-100"
                        options={[
                          {
                            label: "공개",
                            value: "Y",
                          },
                          {
                            label: "비공개",
                            value: "N",
                          },
                        ]}
                        {...field}
                        checkedValue={field.value}
                      />
                    )}
                  />
                )}
                <Controller
                  name={"monopoly"}
                  control={control}
                  rules={{
                    required: "독점 여부를 선택해주세요.",
                  }}
                  render={({ field }) => (
                    <Input
                      label={
                        <div className="flex gap-1 mb-2 items-center">
                          <span
                            className={
                              "text-13pxr md:text-16pxr text-dark-gray-500 after:content-['*'] after:text-red-100 font-semibold"
                            }
                          >
                            독점 여부
                          </span>
                          <ClickExclamationTooltip
                            message="독점으로 등록한 작품만 CP 유료화 대상이 됩니다. 독점/비독점 설정은 최초 생성 시에만 가능하며, 이후 변경할 수 없습니다."
                            id="monopoly-tooltip"
                          />
                        </div>
                      }
                      labelStyle={labelClassName}
                      optionsStyle={`peer-checked:border-primary-100 w-auto h-[46px] md:h-[50px] px-14pxr flex items-center justify-center gap-[7px] border border-light-gray-500 rounded-md ${
                        isMonopolyLocked
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer"
                      }`}
                      activeOptionStyle="border-primary-100"
                      options={[
                        {
                          label: "독점",
                          value: "Y",
                        },
                        {
                          label: "비독점",
                          value: "N",
                        },
                      ]}
                      disabled={isMonopolyLocked}
                      {...field}
                      checkedValue={field.value}
                    />
                  )}
                />
                <p className="mt-[-16px] text-[13px] text-dark-gray-300">
                  독점/비독점 설정은 최초 생성 시에만 가능하니, 신중하게 선택해주세요.
                  라이크노벨은 독점작만 CP(출판사, 매니지먼트) 유료화가 가능합니다.
                </p>
                {monopolyValue === "Y" && (
                  <Controller
                    name={"contract"}
                    control={control}
                    rules={{
                      required: "계약 여부를 선택해주세요.",
                    }}
                    render={({ field }) => (
                      <Input
                        label={
                          <div className="flex gap-1 mb-2 items-center">
                            <span
                              className={
                                "text-13pxr md:text-16pxr text-dark-gray-500 after:content-['*'] after:text-red-100 font-semibold"
                              }
                            >
                              계약 여부
                            </span>
                            <ClickExclamationTooltip
                              message="계약 여부는 독점 작품에서만 설정할 수 있습니다. 계약 상태로 저장한 작품만 유료전환 신청이 가능하며, CP 닉네임을 정확히 입력해야 합니다."
                              id="contract-tooltip"
                            />
                          </div>
                        }
                        labelStyle={labelClassName}
                        optionsStyle={`peer-checked:border-primary-100 w-auto h-[46px] md:h-[50px] px-14pxr flex items-center justify-center gap-[7px] border border-light-gray-500 rounded-md ${
                          isContractLocked
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer"
                        }`}
                        activeOptionStyle="border-primary-100"
                        options={[
                          {
                            label: "계약 안됨",
                            value: "N",
                          },
                          {
                            label: "계약",
                            value: "Y",
                          },
                        ]}
                        disabled={isContractLocked}
                        {...field}
                        checkedValue={field.value}
                      />
                    )}
                  />
                )}
                {monopolyValue === "Y" && contractValue === "Y" && (
                  <Input
                    label="CP 닉네임"
                    labelStyle={requiredLabelClassName}
                    placeholder="담당 CP의 기본 닉네임을 입력하세요"
                    inputStyle={inputTextClassName}
                    disabled={isContractLocked}
                    isError={!!formState.errors.cpNickname || cpValidation.valid === false}
                    errorText={formState.errors.cpNickname?.message || cpValidation.message}
                    successText={cpValidation.valid ? cpValidation.message : undefined}
                    isLoading={isValidatingCpNickname}
                    {...register("cpNickname", {
                      validate: (value) => {
                        if (watch("contract") !== "Y") {
                          return true;
                        }
                        if (!value?.trim()) {
                          return "CP 닉네임을 입력해주세요.";
                        }
                        return true;
                      },
                      onBlur: handleCpNicknameBlur,
                    })}
                  />
                )}
                {isPaidSettingEnabled && (
                  <>
                    <Controller
                      name="paidStartChapterDate"
                      control={control}
                      render={({ field }) => (
                        <div className="md:w-[555px]">
                          <DatePicker
                            label={
                              <div className="w-full flex items-center justify-between">
                                <span>유료회차 시작일</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-12pxr text-dark-gray-300">
                                    예약일 사용
                                  </span>
                                  <Toggle
                                    checked={usePaidStartDate}
                                    disabled={isPaidConversionLocked}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setUsePaidStartDate(checked);
                                      if (!checked) {
                                        setValue("paidStartChapterDate", null);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            }
                            showTimeSelect
                            labelStyle={requiredLabelClassName}
                            inputStyle={inputTextClassName}
                            onChange={(date) =>
                              !isPaidConversionLocked &&
                              usePaidStartDate &&
                              setValue(field.name, date)
                            }
                            value={
                              field.value ? new Date(field.value) : undefined
                            }
                            disabled={isPaidConversionLocked || !usePaidStartDate}
                            placeholder="시작일을 선택하세요"
                          />
                          <p className="mt-8pxr text-12pxr text-dark-gray-300">
                            예약일이 지나도, 아직 유료시작회차에 도달하지 않으면
                            무료작품으로 분류됩니다.
                          </p>
                        </div>
                      )}
                    />
                    <Controller
                      name="paidStartChapter"
                      control={control}
                      render={({ field }) => (
                        <div className="w-full">
                          <SelectBox
                            label="유료 시작 회차"
                            full
                            labelClassName={labelClassName}
                            options={paidStartChapterOptions}
                            value={selectPaidStartChapterValue}
                            onChange={(event) =>
                              field.onChange(Number(event.target.value))
                            }
                            ref={field.ref}
                            disabled={isPaidConversionLocked}
                          />
                          <p className="mt-8pxr text-12pxr leading-[1.6] text-dark-gray-500">
                            <span>설정한 </span>
                            <span className="text-primary-100">
                              {paidStartGuideDateText}
                            </span>
                            <span>에 </span>
                            {resolvedPaidStartChapter === nextPaidStartChapterNo ? (
                              <>
                                <span className="text-primary-100">
                                  다음회차부터
                                </span>
                                <span> 유료로 전환됩니다.</span>
                              </>
                            ) : (
                              <>
                                <span className="text-primary-100">
                                  {resolvedPaidStartChapter}번째회차 이후로 모든 회차
                                </span>
                                <span>가 유료로 전환됩니다.</span>
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    />
                  </>
                )}
                <Controller
                  name="agree"
                  control={control}
                  rules={{
                    required: "이용약관에 동의해주세요.",
                  }}
                  render={({ field }) => (
                    <Checkbox
                      label={
                        <div className="flex">
                          <span>라이크노벨&nbsp;</span>
                          <span
                            className="underline font-semibold"
                            onClick={handleOpenTermsOfUse}
                          >
                            이용약관
                          </span>
                          <span>에 동의합니다.</span>
                        </div>
                      }
                      labelId="agree"
                      labelStyle="text-14pxr"
                      checked={field.value}
                      {...field}
                    />
                  )}
                />
              </section>
            </>
          )}
        </div>
        <BottomButton
          isDirty={formState.isDirty}
          isSubmitting={isSubmitting}
          isCoverUploading={isCoverUploading}
        />
      </form>
      <Modal size="md" />
    </FormProvider>
  );
};

export default FormArea;
