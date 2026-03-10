import {
  useMakeEpisode,
  useMakeNotice,
  useSelectEpisode,
  useSelectNotice,
  useUpdateEpisode,
  useUpdateNotice,
} from "@/app/api/query/author/episode";
import {
  IMakeEpisodeRequest,
  IMakeNoticeRequest,
  ISelectEpisodeResponse,
  ISelectNoticeResponse,
} from "@/app/api/query/author/episode/dto";
import useToastStore from "@/store/toastStore";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Controller, FormProvider, useForm, FieldErrors } from "react-hook-form";
import CheckBox from "../common/CheckBox";
import Editor from "../common/Editor";
import DatePicker from "../form/datepicker";
import Input from "../form/input";
import TextArea from "../form/textarea";
import BottomButton from "./BottomButton";
dayjs.extend(utc);

export interface IMakeEpisodeForm {
  category: "episode" | "notice";
  title: string;
  content: string;
  authorComment: string;
  evaluationOpen: "all" | "evaluation" | "comment";
  isEpisodeOpen: "Y" | "N";
  hasPublishEpisodeDate: "Y" | "N";
  publishEpisodeDate: Date | null | undefined;
  priceType: "free" | "paid";
}

interface Props {
  productId?: number;
  episodeId?: number;
  actionType?: "save" | "submit";
  type?: "episode" | "notice";
}

const FormArea = ({ productId, episodeId, type, actionType }: Props) => {
  const { mutateAsync: makeEpisode, isPending: isMakeEpisodePending } =
    useMakeEpisode();
  const { mutateAsync: makeNotice, isPending: isMakeNoticePending } =
    useMakeNotice();
  const { mutateAsync: selectEpisode } = useSelectEpisode();
  const { mutateAsync: selectNotice } = useSelectNotice();
  const { mutateAsync: updateEpisode, isPending: isUpdateEpisodePending } =
    useUpdateEpisode();
  const { mutateAsync: updateNotice, isPending: isUpdateNoticePending } =
    useUpdateNotice();

  // Check if any mutation is in progress
  const isMutating =
    isMakeEpisodePending ||
    isMakeNoticePending ||
    isUpdateEpisodePending ||
    isUpdateNoticePending;
  const { setToast } = useToastStore();
  const router = useRouter();

  const methods = useForm<IMakeEpisodeForm>({
    defaultValues: async () => {
      let defaultData = [] as any;
      let originData = {} as any;
      if (episodeId && type === "episode") {
        defaultData = await selectEpisode(episodeId);
        console.log("defaultData", defaultData);
        originData = getDefaultValue(defaultData);
      }
      if (episodeId && type === "notice") {
        defaultData = await selectNotice(episodeId);
        console.log("defaultData notice", defaultData);
        originData = getDefaultNoticeValue(defaultData);
      }
      return {
        category: episodeId ? originData.category : "episode",
        title: episodeId ? originData.title : "",
        content: episodeId ? originData.content : "",
        authorComment: episodeId ? originData.authorComment : "",
        evaluationOpen: episodeId ? originData.evaluationOpen : "all",
        isEpisodeOpen: episodeId ? originData.isEpisodeOpen : "Y",
        hasPublishEpisodeDate: episodeId
          ? originData.hasPublishEpisodeDate
          : "N",
        publishEpisodeDate: episodeId ? originData.publishEpisodeDate : null,
        priceType: episodeId ? originData.priceType : "free",
      };
    },
  });
  const {
    handleSubmit,
    register,
    control,
    watch,
    setValue,
  } = methods;

  const categoryValue = watch("category");

  useEffect(() => {
    if (categoryValue === "notice") {
      setValue("authorComment", "");
    }
  }, [categoryValue, setValue]);

  const getDefaultValue = (data: ISelectEpisodeResponse) => {
    return {
      category: "episode",
      title: data.data.title,
      content: data.data.content,
      authorComment: data.data.authorComment,
      evaluationOpen:
        data.data.evaluationOpenYn === "Y" && data.data.commentOpenYn === "Y"
          ? "all"
          : data.data.evaluationOpenYn === "Y"
          ? "evaluation"
          : "comment",
      isEpisodeOpen: data.data.episodeOpenYn,
      hasPublishEpisodeDate: data.data.publishReserveYn,
      publishEpisodeDate: data.data.publishReserveDate,
      priceType: data.data.priceType,
    };
  };

  const getDefaultNoticeValue = (data: ISelectNoticeResponse) => {
    return {
      category: "notice",
      title: data.data.title,
      content: data.data.content,
      hasPublishEpisodeDate: data.data.publishReserveYn,
      publishEpisodeDate: data.data.publishReserveDate,
    };
  };

  const onError = (errors: FieldErrors<IMakeEpisodeForm>) => {
    let message: string | undefined;
    if (errors.title?.message) {
      message = errors.title.message as string;
    } else if (errors.content?.message) {
      message = errors.content.message as string;
    }

    if (message) {
      setToast({
        message,
        type: "error",
      });
    }
  };

  const transformFormDataToRequestData = (
    formData: IMakeEpisodeForm
  ): IMakeEpisodeRequest => {
    return {
      title: formData.title,
      content: formData.content,
      author_comment: formData.authorComment,
      evaluation_open_yn:
        formData.evaluationOpen === "all" ||
        formData.evaluationOpen === "evaluation"
          ? "Y"
          : "N",
      comment_open_yn:
        formData.evaluationOpen === "all" ||
        formData.evaluationOpen === "comment"
          ? "Y"
          : "N",
      episode_open_yn:
        formData.hasPublishEpisodeDate === "Y"
          ? "N"
          : formData.isEpisodeOpen,
      publish_reserve_yn: formData.hasPublishEpisodeDate,
      publish_reserve_date:
        formData.publishEpisodeDate !== undefined &&
        formData.publishEpisodeDate !== null
          ? dayjs(formData.publishEpisodeDate).utc().format()
          : null,
      price_type: null,
    };
  };

  const transformFormDataToNoticeRequestData = (
    formData: IMakeEpisodeForm
  ): IMakeNoticeRequest => {
    return {
      title: formData.title,
      content: formData.content,
      open_yn: formData.isEpisodeOpen || "Y",
      publish_reserve_yn: formData.hasPublishEpisodeDate,
      publish_reserve_date:
        formData.publishEpisodeDate !== undefined &&
        formData.publishEpisodeDate !== null
          ? dayjs(formData.publishEpisodeDate).utc().format()
          : null,
    };
  };

  const handleSave = async (formData: IMakeEpisodeForm) => {
    // Prevent duplicate submissions
    if (!productId || isMutating) return;
    try {
      if (formData.category === "notice") {
        const requestData = transformFormDataToNoticeRequestData(formData);
        await makeNotice(
          {
            data: requestData,
            productId: productId,
            isSave: "Y",
            product_notice_id: null,
          },
          {
            onSuccess: (data: any) => {
              const noticeId = data?.data?.data?.productNoticeId;
              setToast({
                message: "공지 저장에 성공했습니다.",
                type: "success",
              });
              router.push(`/making-episode/${productId}/${noticeId}/notice`);
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "공지 저장에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      } else {
        const requestData = transformFormDataToRequestData(formData);
        await makeEpisode(
          {
            data: requestData,
            productId: productId,
            isSave: "Y",
            episodeId: null,
          },
          {
            onSuccess: (data: any) => {
              console.log("data", data);
              const episode = data?.data?.data?.episodeId;
              setToast({
                message: "회차 저장에 성공했습니다.",
                type: "success",
              });
              router.push(`/making-episode/${productId}/${episode}/episode`);
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "회차 저장에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      }
    } catch (e) {
      setToast({
        message:
          formData.category === "notice"
            ? "공지 저장에 실패했습니다."
            : "회차 저장에 실패했습니다.",
        type: "error",
      });
    }
  };

  const handleSubmitForm = async (formData: IMakeEpisodeForm) => {
    // Prevent duplicate submissions
    if (!productId || isMutating) return;

    try {
      if (formData.category === "notice") {
        const requestData = transformFormDataToNoticeRequestData(formData);

        await makeNotice(
          {
            data: requestData,
            productId: productId,
            isSave: "N",
            product_notice_id: null,
          },
          {
            onSuccess: () => {
              router.push(`/product/author/episode-manager/${productId}`);
              setToast({
                message: "공지 등록에 성공했습니다.",
                type: "success",
              });
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "공지 등록에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      } else {
        const requestData = transformFormDataToRequestData(formData);
        await makeEpisode(
          {
            data: requestData,
            productId: productId,
            isSave: "N",
            episodeId: null,
          },
          {
            onSuccess: () => {
              router.push(`/product/author/episode-manager/${productId}`);
              setToast({
                message: "회차 등록에 성공했습니다.",
                type: "success",
              });
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "회차 등록에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      }
    } catch (e) {
      setToast({
        message:
          formData.category === "notice"
            ? "공지 등록에 실패했습니다."
            : "회차 등록에 실패했습니다.",
        type: "error",
      });
    }
  };

  const handleUpdate = async (formData: IMakeEpisodeForm) => {
    // Prevent duplicate submissions
    if (isMutating) return;

    try {
      if (formData.category === "notice") {
        const requestData = transformFormDataToNoticeRequestData(formData);
        await updateNotice(
          {
            data: requestData,
            noticeId: episodeId || 0,
          },
          {
            onSuccess: () => {
              router.push(`/product/author/episode-manager/${productId}`);
              setToast({
                message: "공지 수정에 성공했습니다.",
                type: "success",
              });
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "공지 수정에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      } else {
        const requestData = transformFormDataToRequestData(formData);
        await updateEpisode(
          { episodeId: episodeId || 0, data: requestData },
          {
            onSuccess: () => {
              setToast({
                message: "회차 수정에 성공했습니다.",
                type: "success",
              });
              router.push(`/product/author/episode-manager/${productId}`);
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "회차 수정에 실패했습니다.",
                type: "error",
              });
            },
          }
        );
      }
    } catch (e) {
      setToast({
        message: "회차 수정에 실패했습니다.",
        type: "error",
      });
    }
  };

  const labelClassName =
    "text-13pxr md:text-16pxr text-dark-gray-500 font-semibold mb-10pxr";
  const requiredLabelClassName = `${labelClassName} after:content-['*'] after:text-red-100`;
  const inputTextClassName =
    "text-14pxr md:text-16pxr h-40pxr md:h-44pxr text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] pl-9pxr pr-11pxr";
  return (
    <FormProvider {...methods}>
      <form className="w-full max-w-[1120px] mx-auto">
        <div className="md:flex md:bg-white mt-[50px] md:mt-[90px] md:px-[120px]">
          <section className="flex flex-col bg-white mt-8pxr pt-32pxr pb-17pxr px-16pxr gap-33pxr md:flex-1">
            <Controller
              name={"category"}
              control={control}
              render={({ field }) => (
                <Input
                  label={"분류"}
                  labelStyle={requiredLabelClassName}
                  optionsStyle="peer-checked:border-primary-100 w-auto h-[46px] md:h-[50px] px-14pxr flex items-center justify-center gap-[7px] border border-light-gray-500 rounded-md cursor-pointer"
                  activeOptionStyle="border-primary-100"
                  options={[
                    {
                      label: "회차",
                      value: "episode",
                    },
                    {
                      label: "공지",
                      value: "notice",
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
              maxLength={30}
              placeholder="회차명을 입력해주세요 (최대 30자)"
              inputStyle={inputTextClassName}
              {...register("title", { required: "제목을 입력해주세요." })}
              additionalText={
                <span className="text-black-100 text-11pxr mr-3">
                  {watch("title")?.length}
                  <span className="text-dark-gray-100">{` / 30자`}</span>
                </span>
              }
            />
            <label className={requiredLabelClassName + " mb-[-20px]"}>
              내용
            </label>
            <Controller
              name="content"
              control={control}
              rules={{
                required: "내용을 입력해주세요.",
              }}
              render={({ field }) => (
                <Editor
                  value={field.value || ""}
                  onChange={(value) => field.onChange(value)}
                />
              )}
            />
            <TextArea
              {...register("authorComment")}
              label="작가의 말"
              labelStyle={labelClassName}
              maxLength={800}
              placeholder={"내용을 입력하세요."}
              disabled={watch("category") === "notice"}
              inputStyle={`text-14pxr md:text-16pxr h-[212px] md:min-h-[100px] text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] resize-none md:resize-y overflow-y-auto ${
                watch("category") === "notice"
                  ? "bg-gray-100 cursor-not-allowed"
                  : ""
              }`}
              additionalText={
                <div className="text-black-100 text-11pxr bg-white pl-1 h-full mr-3">
                  {watch("authorComment")?.length}
                  <span className="text-dark-gray-100">{` / 800자`}</span>
                </div>
              }
            />
            <Controller
              name={"evaluationOpen"}
              control={control}
              render={({ field }) => (
                <Input
                  label={"평가 공개 여부"}
                  labelStyle={labelClassName}
                  optionsStyle="peer-checked:border-primary-100 w-auto h-[46px] md:h-[50px] px-14pxr flex items-center justify-center gap-[7px] border border-light-gray-500 rounded-md cursor-pointer"
                  activeOptionStyle="border-primary-100"
                  options={[
                    {
                      label: "댓글/평가 모두 받기",
                      value: "all",
                    },
                    {
                      label: "평가만 받기",
                      value: "evaluation",
                    },
                    {
                      label: "댓글만 받기",
                      value: "comment",
                    },
                  ]}
                  {...field}
                  checkedValue={field.value}
                />
              )}
            />
            <Controller
              name={"isEpisodeOpen"}
              control={control}
              render={({ field }) => (
                <Input
                  label={"회차 공개 여부"}
                  labelStyle={requiredLabelClassName}
                  optionsStyle="peer-checked:border-primary-100 w-auto h-[46px] md:h-[50px] px-14pxr flex items-center justify-center gap-[7px] border border-light-gray-500 rounded-md cursor-pointer"
                  activeOptionStyle="border-primary-100"
                  options={[
                    {
                      label: "즉시공개",
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
              name="hasPublishEpisodeDate"
              control={control}
              defaultValue={"N"}
              render={({ field: checkboxField }) => (
                <div className="flex items-center gap-10pxr">
                  <CheckBox
                    label="예약설정 시작일"
                    labelStyle={labelClassName}
                    checked={checkboxField.value === "Y"}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      checkboxField.onChange(isChecked ? "Y" : "N");
                      if (isChecked) {
                        setValue("isEpisodeOpen", "N");
                      } else {
                        setValue("publishEpisodeDate", null);
                      }
                    }}
                    checkedColor="bg-primary-100"
                    checkBoxStyle="w-[20px] h-[20px] border"
                  />
                </div>
              )}
            />
            {watch("hasPublishEpisodeDate") === "Y" && (
              <Controller
                name="publishEpisodeDate"
                control={control}
                render={({ field }) => (
                  <div className="flex md:w-[555px] mt-[-30px]">
                    <DatePicker
                      label=""
                      placeholder="시작일을 선택하세요."
                      showTimeSelect
                      showChangeYearOrMonth
                      inputStyle={
                        inputTextClassName + " placeholder:text-12pxr"
                      }
                      onChange={(date) => setValue(field.name, date)}
                      value={field.value === null ? undefined : field.value}
                    />
                  </div>
                )}
              />
            )}
          </section>
        </div>
        {actionType === "save" ? (
          <BottomButton
            actionType="save"
            isSubmitting={isMutating}
            onSave={() => handleSubmit(handleSave, onError)()}
            onSubmit={() => handleSubmit(handleSubmitForm, onError)()}
          />
        ) : (
          <BottomButton
            actionType="submit"
            isSubmitting={isMutating}
            onSave={() => handleSubmit(handleSave, onError)()}
            onSubmit={() => handleSubmit(handleSubmitForm, onError)()}
            onUpdate={() => handleSubmit(handleUpdate, onError)()}
          />
        )}
      </form>
    </FormProvider>
  );
};

export default FormArea;
