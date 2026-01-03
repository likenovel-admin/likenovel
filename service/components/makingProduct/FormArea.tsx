"use client";
import {
  useMakeProduct,
  useSelectEpisodeCount,
  useSelectGenres,
  useSelectMakingProduct,
  useUpdateProduct,
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
import TextArea from "../form/textarea";
import OperationPolicyModal from "../modal/OperationPolicyModal";
import BaseSearchTag from "./BaseSearchTag";
import BottomButton from "./BottomButton";
import PhotoArea from "./PhotoArea";
import StoppedTooltip from "./StoppedTooltip";
dayjs.extend(utc);

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
  ageGrade: "all" | "under18";
  open: "Y" | "N";
  monopoly: "Y" | "N";
  contract: "Y" | "N";
  paidStartChapterDate: Date | null;
  paidStartChapter: number;
  agree: boolean;
  baseTag?: { value: string; label: string }[];
  directTag?: { value: string; label: string }[];
}

interface IOriginProduct extends IMakeProductForm {
  coverImagePath: string;
  priceType: "free" | "paid";
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
  const { data: genres } = useSelectGenres();
  const { mutateAsync: selectEpisodeCount, data: episodeCount } =
    useSelectEpisodeCount();
  const { mutate: makeProduct } = useMakeProduct();
  const {
    mutateAsync: selectProduct,
    data,
    isPending,
  } = useSelectMakingProduct();
  const { mutate: updateProduct } = useUpdateProduct();
  const { data: userInfo } = useSelectUserInfo(currentUser?.userId ?? 0);

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
        updateFrequency: productId ? originData.updateFrequency : ["mon"],
        primaryGenre: productId ? originData.primaryGenre || "" : "현대판타지",
        subGenre: productId ? originData.subGenre : "",
        synopsis: productId ? originData.synopsis : "",
        ageGrade: productId ? originData.ageGrade : "all",
        open: productId ? originData.open : "Y",
        monopoly: productId ? originData.monopoly : "Y",
        contract: productId ? originData.contract : "N",
        paidStartChapterDate:
          productId && defaultData?.data.priceType === "paid"
            ? originData.paidStartChapterDate ||
              dayjs()
                .add(1, "day")
                .hour(12)
                .minute(0)
                .second(0)
                .millisecond(0)
                .toDate()
            : null,
        paidStartChapter: productId ? originData.paidStartChapter || 1 : 1,
        agree: false,
        baseTag: productId ? originData.baseTag : [],
        directTag: productId ? originData.directTag : [],
      };
    },
  });

  const { handleSubmit, register, control, setValue, reset, watch, formState } =
    methods;
  const { setToast } = useToastStore();
  const { setConfirm } = useConfirmStore();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(false);

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
      ageGrade: data?.data.adultYn === "N" ? "all" : ("under18" as const),
      open: data?.data.openYn || "Y",
      monopoly: data?.data.monopolyYn || "N",
      contract: data?.data.cpContractYn || "N",
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
      publishRegularYn: data?.data.publishRegularYn || "Y",
    };
    return defaultValues;
  };

  // 이미지 파일 아이디
  const [fileId, setFileId] = useState<number | null>(null);

  const handleFileId = (newFileId: number) => {
    setFileId(newFileId);
  };

  const onSubmit = async (data: IMakeProductForm) => {
    if (!data.agree) {
      return;
    }
    setIsSubmitting(true);
    if (productId) {
      const requestData: any = transformFormDataToRequestData(data);
      // Ensure valid date with default to tomorrow 12:00 if null/invalid
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
      requestData.paid_episode_no = data.paidStartChapter || 1;
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
        content: "운영정책에 동의해주세요.",
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
      open_yn: formData.open,
      monopoly_yn: formData.monopoly,
      cp_contract_yn: formData.contract,
    };

    if (productId) {
      const paidDate = formData.paidStartChapterDate
        ? formData.paidStartChapterDate
        : dayjs()
            .add(1, "day")
            .hour(12)
            .minute(0)
            .second(0)
            .millisecond(0)
            .toDate();
      (requestData as IUpdateProductRequest).paid_setting_date = new Date(
        dayjs.utc(paidDate).format()
      );
      (requestData as IUpdateProductRequest).paid_episode_no =
        formData.paidStartChapter || 1;
    }
    return requestData;
  };

  const handleOpenOperationPolicy = () => {
    setModal(<OperationPolicyModal />);
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
                          <ExclamationTooltip />
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
                              <StoppedTooltip />
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
                    required: "연재요일을 최소 1개 이상 선택해주세요.",
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
                            연재 요일
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
                            label: "선택 안함",
                            value: "",
                          },
                          ...(genres?.data.map(
                            (genre: { genreId: number; genre: string }) => ({
                              label: genre.genre,
                              value: genre.genre,
                            })
                          ) || []),
                        ]}
                        value={field.value || ""}
                        onChange={field.onChange}
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
                          ...(genres?.data.map(
                            (genre: { genreId: number; genre: string }) => ({
                              label: genre.genre,
                              value: genre.genre,
                            })
                          ) || []),
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
                            message="회차를 읽고 작품 평가에 참여합니다."
                            id="monopoly-tooltip"
                          />
                        </div>
                      }
                      labelStyle={labelClassName}
                      optionsStyle="peer-checked:border-primary-100 w-auto h-[46px] md:h-[50px] px-14pxr flex items-center justify-center gap-[7px] border border-light-gray-500 rounded-md cursor-pointer"
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
                      {...field}
                      checkedValue={field.value}
                    />
                  )}
                />
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
                            message="회차를 읽고 작품 평가에 참여합니다."
                            id="contract-tooltip"
                          />
                        </div>
                      }
                      labelStyle={labelClassName}
                      optionsStyle="peer-checked:border-primary-100 w-auto h-[46px] md:h-[50px] px-14pxr flex items-center justify-center gap-[7px] border border-light-gray-500 rounded-md cursor-pointer"
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
                      {...field}
                      checkedValue={field.value}
                    />
                  )}
                />
                {productId && data?.data.priceType === "paid" && (
                  <>
                    <Controller
                      name="paidStartChapterDate"
                      control={control}
                      render={({ field }) => (
                        <div className="md:w-[555px]">
                          <DatePicker
                            label="유료회차 시작일"
                            showTimeSelect
                            labelStyle={requiredLabelClassName}
                            inputStyle={inputTextClassName}
                            onChange={(date) => setValue(field.name, date)}
                            value={
                              field.value ? new Date(field.value) : undefined
                            }
                            placeholder="시작일을 선택하세요"
                          />
                        </div>
                      )}
                    />
                    <Controller
                      name="paidStartChapter"
                      control={control}
                      render={({ field }) => (
                        <SelectBox
                          label="유료 시작 회차"
                          full
                          labelClassName={labelClassName}
                          options={
                            episodeCount &&
                            episodeCount.data?.hasEpisodeCount >= 1
                              ? Array.from(
                                  {
                                    length:
                                      episodeCount?.data.hasEpisodeCount ?? 0,
                                  },
                                  (_, index) => ({
                                    label: `${index + 1}회`,
                                    value: `${index + 1}`,
                                  })
                                )
                              : [{ label: "연재 회차가 없습니다.", value: "1" }]
                          }
                          value={String(field.value || "1")}
                          onChange={field.onChange}
                          ref={field.ref}
                        />
                      )}
                    />
                  </>
                )}
                <Controller
                  name="agree"
                  control={control}
                  rules={{
                    required: "운영정책에 동의해주세요.",
                  }}
                  render={({ field }) => (
                    <Checkbox
                      label={
                        <div className="flex">
                          <span>라이크노벨&nbsp;</span>
                          <span
                            className="underline font-semibold"
                            onClick={handleOpenOperationPolicy}
                          >
                            운영정책
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
        <BottomButton isDirty={formState.isDirty} />
      </form>
      <Modal size="md" />
    </FormProvider>
  );
};

export default FormArea;
