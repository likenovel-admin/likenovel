import { createSupportQna } from "@/app/api/query/support";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Button from "../common/Button";
import CheckBox from "../common/CheckBox";
import Input from "../form/input";
import SelectBox from "../form/selectbox";
import TextArea from "../form/textarea";

type InquiryFormValues = {
  category: string;
  title: string;
  email: string;
  contents: string;
  agree: boolean;
};

const InquiryForm = () => {
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const labelClassName =
    "text-13pxr md:text-16pxr text-dark-gray-500 font-semibold mb-10pxr";
  const requiredLabelClassName = `${labelClassName} after:content-['*'] after:text-red-100`;
  const inputTextClassName =
    "text-14pxr md:text-16pxr h-40pxr md:h-44pxr text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] pl-9pxr pr-11pxr";
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryFormValues>({
    defaultValues: {
      category: "서비스문의",
      agree: false,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage("");
    try {
      const qnaId = await createSupportQna({
        category: data.category,
        subject: data.title.trim(),
        content: data.contents.trim(),
        email: data.email.trim(),
      });
      reset({ category: "서비스문의", title: "", email: "", contents: "", agree: false });
      setSubmitMessage(`문의가 접수되었습니다. 접수번호는 ${qnaId}번입니다.`);
    } catch (error) {
      setSubmitMessage(
        error instanceof Error
          ? `문의 접수에 실패했습니다. ${error.message}`
          : "문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit}>
      <div className="pt-8 flex flex-col gap-6">
        <div>
          <div className={requiredLabelClassName}>문의분류</div>
          <div className="flex gap-1 w-full">
            <div className="flex-[3]">
              <Controller
                name="category"
                control={control}
                rules={{ required: "문의분류를 선택해주세요." }}
                render={({ field }) => (
                  <SelectBox
                    full
                    {...field}
                    options={[
                      { label: "서비스 문의", value: "서비스문의" },
                      { label: "회원 문의", value: "회원상태문의" },
                      { label: "결제 및 환불", value: "결제문의" },
                      { label: "정산 문의", value: "정산문의" },
                      { label: "버그 신고", value: "버그리포팅" },
                      { label: "제휴 문의", value: "제휴문의" },
                      { label: "작품 신고", value: "작품신고" },
                      { label: "게시물 신고", value: "게시물신고" },
                      { label: "기타 의견", value: "바라는점" },
                    ]}
                  />
                )}
              />
            </div>
            <div className="flex-[7]">
              <Input
                full
                inputStyle={inputTextClassName}
                {...register("title", {
                  required: "제목을 입력해주세요.",
                  maxLength: { value: 300, message: "제목은 300자까지 입력할 수 있습니다." },
                })}
                placeholder="제목을 입력하세요"
              />
            </div>
          </div>
        </div>

        <div>
          <div className={requiredLabelClassName}>회신받을 이메일</div>
          <Input
            full
            type="email"
            inputStyle={inputTextClassName}
            {...register("email", {
              required: "이메일을 입력해주세요.",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "올바른 이메일 주소를 입력해주세요.",
              },
              maxLength: { value: 100, message: "이메일은 100자까지 입력할 수 있습니다." },
            })}
            placeholder="example@email.com"
          />
        </div>

        <TextArea
          {...register("contents", {
            required: "문의 내용을 입력해주세요.",
            maxLength: { value: 20000, message: "문의 내용은 20,000자까지 입력할 수 있습니다." },
          })}
          inputStyle="text-14pxr md:text-16pxr text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] pl-9pxr pr-11pxr md:h-[500px] h-[250px]"
          placeholder="내용을 입력하세요"
          label="내용"
          labelStyle={requiredLabelClassName}
        />

        <Controller
          name="agree"
          control={control}
          rules={{ required: "개인정보 수집 및 이용에 동의해주세요." }}
          render={({ field }) => (
            <CheckBox
              checked={field.value}
              {...field}
              label={
                <div className="flex flex-col">
                  <span className="text-12pxr md:text-14pxr text-gray-600 font-semibold">
                    (필수) 개인정보 수집 및 이용에 동의합니다.
                  </span>
                  <span className="text-12pxr md:text-14pxr text-gray-600 font-normal">
                    동의를 거부할 수 있으나 문의 처리 및 회신이 제한됩니다.
                  </span>
                </div>
              }
              checkBoxStyle="min-w-[20px] min-h-[20px] border self-start"
              className="text-13pxr md:text-16pxr text-dark-gray-500 font-semibold mb-10pxr"
            />
          )}
        />

        {Object.values(errors)[0]?.message && (
          <p className="text-13pxr text-red-100" role="alert">
            {Object.values(errors)[0]?.message}
          </p>
        )}
        {submitMessage && (
          <p className="text-13pxr text-dark-gray-500" role="status">
            {submitMessage}
          </p>
        )}

        <div className="md:border-t md:pt-8 border-0 md:relative sticky bottom-0 w-full pb-4 mt-8 rounded-t-lg pt-4 flex gap-2">
          <Button
            size="xl"
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[50px] md:w-[30%] mx-auto"
          >
            {isSubmitting ? "접수 중..." : "문의하기"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default InquiryForm;
