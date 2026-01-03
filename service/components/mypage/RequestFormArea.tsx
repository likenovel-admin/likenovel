import { useUserApplyRole } from "@/app/api/query/mypage/user";
import { useCreateUpload, useUpdateUpload } from "@/app/api/query/upload";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import CheckBox from "../common/CheckBox";
import BottomButton from "../form/bottomButton";
import Input from "../form/input";
import DocumentAddArea from "./DocumentAddArea";

const RequestFormArea = () => {
  const methods = useForm();
  const {
    handleSubmit,
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = methods;

  const queryClient = useQueryClient();
  const { setToast } = useToastStore();
  const { closeModal } = useModalStore();
  const createUpload = useCreateUpload();
  const updateUpload = useUpdateUpload();
  const { mutate: applyRole, isPending } = useUserApplyRole();

  const onSubmit = async (data: any) => {
    if (updateUpload.isPending || isPending || createUpload.isPending) {
      return;
    }
    // start upload
    let attachment_file_1stId = null;
    if (data.attachment_file_1st) {
      const file = data.attachment_file_1st as File;
      const res = await createUpload.mutateAsync(
        {
          group_type: "user",
          file_name: file.name,
        },
        {
          onError: (error: any) => {
            setToast({
              message:
                error?.response?.data?.message ||
                "파일 업로드에 실패하였습니다.",
              type: "error",
            });
          },
        }
      );
      await updateUpload.mutateAsync(
        {
          url: res.data.uploadPath,
          // file: formData,
          file: file,
          file_type: file.type,
        },
        {
          onError: (error: any) => {
            setToast({
              message:
                error?.response?.data?.message ||
                "파일 업로드에 실패하였습니다.",
              type: "error",
            });
          },
        }
      );
      attachment_file_1stId = res.data.fileId;
    }

    let attachment_file_2stId = null;
    if (data.attachment_file_2nd) {
      const file = data.attachment_file_2nd as File;
      const res = await createUpload.mutateAsync(
        {
          group_type: "user",
          file_name: file.name,
        },
        {
          onError: (error: any) => {
            setToast({
              message:
                error?.response?.data?.message ||
                "파일 업로드에 실패하였습니다.",
              type: "error",
            });
          },
        }
      );
      await updateUpload.mutateAsync(
        {
          url: res.data.uploadPath,
          // file: formData,
          file: file,
          file_type: file.type,
        },
        {
          onError: (error: any) => {
            setToast({
              message:
                error?.response?.data?.message ||
                "파일 업로드에 실패하였습니다.",
              type: "error",
            });
          },
        }
      );
      attachment_file_2stId = res.data.fileId as number;
    }

    applyRole(
      {
        apply_type: data.requestType,
        company_name: data.companyName,
        email: data.email,
        attachment_file_id_1st: attachment_file_1stId || undefined,
        attachment_file_id_2nd: attachment_file_2stId || undefined,
      },
      {
        onSuccess: () => {
          setToast({
            message: "신청이 완료되었습니다.",
            type: "success",
          });
          closeModal();
          queryClient.invalidateQueries({ queryKey: ["selectUserInfo"] });
        },
        onError: (error: any) => {
          setToast({
            message: error?.response?.data?.message || "신청에 실패하였습니다.",
            type: "error",
          });
        },
      }
    );
  };
  console.log("watch", watch());
  const labelClassName =
    "text-13pxr md:text-16pxr text-dark-gray-500 font-semibold mb-10pxr";
  const requiredLabelClassName = `${labelClassName} after:content-['*'] after:text-red-100`;
  const inputTextClassName =
    "text-14pxr md:text-16pxr h-40pxr md:h-44pxr text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] pl-9pxr pr-11pxr";
  const [checked, setChecked] = useState(false);
  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="md:flex md:bg-white">
          <section className="flex flex-col bg-white mt-8pxr pt-22pxr md:pt-32pxr pb-17pxr px-16pxr md:px-36pxr gap-33pxr md:flex-1">
            <Controller
              name={"requestType"}
              control={control}
              rules={{ required: "신청구분을 선택해주세요." }}
              render={({ field }) => (
                <Input
                  label={"신청구분"}
                  labelStyle={requiredLabelClassName}
                  optionsStyle="peer-checked:border-primary-100 w-auto h-[46px] flex items-center justify-center cursor-pointer"
                  options={[
                    {
                      label: "편집자 신청",
                      value: "editor",
                    },
                    {
                      label: "CP사 입점",
                      value: "cp",
                    },
                  ]}
                  {...field}
                  checkedValue={field.value}
                />
              )}
            />
            <Input
              label="회사명"
              labelStyle={requiredLabelClassName}
              placeholder="회사명을 입력하세요."
              inputStyle={inputTextClassName}
              maxLength={30}
              {...register("companyName", {
                required: "회사명을 입력해주세요.",
                maxLength: {
                  value: 30,
                  message: "회사명은 30자 이내로 입력해주세요.",
                },
              })}
              additionalText={
                <span className="text-black-100 text-11pxr mr-3">
                  {watch("companyName")?.length || 0}
                  <span className="text-dark-gray-100">{` / 30자`}</span>
                </span>
              }
            />
            <Input
              label="연락받을 이메일"
              labelStyle={requiredLabelClassName}
              placeholder="이메일을 입력하세요."
              inputStyle={inputTextClassName}
              maxLength={50}
              {...register("email", {
                required: "이메일을 입력해주세요.",
                maxLength: {
                  value: 50,
                  message: "이메일은 50자 이내로 입력해주세요.",
                },
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "유효한 이메일 주소를 입력해주세요.",
                },
              })}
              additionalText={
                <span className="text-black-100 text-11pxr mr-3">
                  {watch("email")?.length || 0}
                  <span className="text-dark-gray-100">{` / 50자`}</span>
                </span>
              }
            />
            <DocumentAddArea />
            <div className="flex text-black-100 text-12pxr gap-1 pb-2 border-b border-light-gray-100">
              <Image
                src="/images/triangle-warn-red.svg"
                alt="경고"
                width={12}
                height={11}
              />
              사칭, 문서 위조는 확인 시 통보 없이 영구 정지이며 피해 발생 시
              추가적 책임을 물을 수 있습니다.
            </div>
            <div>
              <div className="text-dark-gray-300 text-12pxr">
                관련 문의사항은{" "}
                <a className="underline" href="mailTo:admin@likenovel.net">
                  admin@likenovel.net
                </a>
                으로 연락 주시면 감사드리겠습니다.
              </div>
              <div className="text-dark-gray-300 text-12pxr">
                신청절차가 모두 완료되면 해당 계정에 신청하신 내용으로 프로필이
                새로 생성됩니다.
              </div>
            </div>
            <CheckBox
              checked={checked}
              label="위의 안내 사항을 모두 이해하였습니다."
              labelStyle="text-14pxr text-black-100"
              onChange={(event) => setChecked(event.target.checked)}
            />
          </section>
        </div>
        <BottomButton
          submitText="신청"
          onSubmitClick={handleSubmit(onSubmit)}
          onCancelClick={closeModal}
          disabledSubmit={
            !checked ||
            updateUpload.isPending ||
            isPending ||
            createUpload.isPending
          }
        />
      </form>
    </FormProvider>
  );
};

export default RequestFormArea;
