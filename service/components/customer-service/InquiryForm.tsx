import { Controller, useForm } from "react-hook-form";
import CheckBox from "../common/CheckBox";
// import Checkbox from "../form/checkbox/Checkbox";
import Button from "../common/Button";
import Input from "../form/input";
import SelectBox from "../form/selectbox";
import TextArea from "../form/textarea";
import InquiryAddFileArea from "./InquiryAddFileArea";

const InquiryForm = () => {
  const labelClassName =
    "text-13pxr md:text-16pxr text-dark-gray-500 font-semibold mb-10pxr";
  const requiredLabelClassName = `${labelClassName} after:content-['*'] after:text-red-100`;
  const inputTextClassName =
    "text-14pxr md:text-16pxr h-40pxr md:h-44pxr text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] pl-9pxr pr-11pxr";
  const { control, register, setValue, watch, handleSubmit } = useForm();
  console.log("form", watch());
  return (
    <form
      onSubmit={handleSubmit((data) => {
        console.log("submit", data);
      })}
    >
      <div className="pt-8 flex flex-col gap-6">
        <div className="">
          <div className={requiredLabelClassName}>문의분류</div>
          <div className="flex gap-1 w-full">
            <div className="flex-[3]">
              <Controller
                name="type"
                control={control}
                rules={{ required: "문의분류를 선택해주세요." }}
                render={({ field }) => (
                  <SelectBox
                    full
                    {...field}
                    options={[
                      {
                        label: "전체",
                        value: "all",
                      },
                      {
                        label: "회원문의",
                        value: "member",
                      },
                      {
                        label: "이용문의",
                        value: "use",
                      },
                      {
                        label: "결제 및 환불",
                        value: "payment",
                      },
                      {
                        label: "사이트 이용 문의",
                        value: "site",
                      },
                      {
                        label: "서비스 이용 문의",
                        value: "service",
                      },
                    ]}
                  />
                )}
              />
            </div>
            <div className="flex-[7]">
              <Input
                full
                inputStyle={inputTextClassName}
                {...register("title", { required: "제목을 입력하세요" })}
                placeholder="제목을 입력하세요"
              />
            </div>
          </div>
        </div>
        <div>
          <div className={requiredLabelClassName}>회신받을 이메일</div>
          <div className="flex gap-1 items-center flex-col md:flex-row w-full">
            <div className="flex items-center gap-1 w-full flex-[3]">
              <div className="flex-[3]">
                <Input
                  inputStyle={inputTextClassName}
                  {...register("emailFirst", {
                    required: "이메일을 입력하세요",
                  })}
                  placeholder="이메일을 입력하세요"
                />
              </div>
              <span>@</span>
            </div>
            <div className="flex gap-1 items-center w-full flex-[5]">
              <div className="flex-[3] w-full">
                <Input
                  inputStyle={inputTextClassName}
                  {...register("emailSecond", {
                    required: "이메일을 입력하세요",
                  })}
                />
              </div>
              <div className="flex-[3] w-full">
                <SelectBox
                  value={watch("emailSecond")}
                  full
                  options={[
                    {
                      label: "직접입력",
                      value: "",
                    },
                    {
                      label: "naver.com",
                      value: "naver.com",
                    },
                    {
                      label: "gmail.com",
                      value: "gmail.com",
                    },
                  ]}
                  onChange={(event) =>
                    setValue("emailSecond", event.target.value, {
                      shouldValidate: true,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
        <TextArea
          {...register("contents")}
          inputStyle={`text-14pxr md:text-16pxr text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] pl-9pxr pr-11pxr md:h-[500px] h-[250px]`}
          placeholder="내용을 입력하세요"
          label="내용"
          labelStyle={requiredLabelClassName}
        />
        <InquiryAddFileArea />
        <Controller
          name="agree"
          control={control}
          defaultValue={false}
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
                    위 동의를 거부할 권리가 있으며 동의를 거부하실 경우 문의처리
                    및 회신이 제한됩니다.
                  </span>
                </div>
              }
              checkBoxStyle={"min-w-[20px] min-h-[20px] border self-start"}
              className="text-13pxr md:text-16pxr text-dark-gray-500 font-semibold mb-10pxr"
            />
          )}
        />
        <div className="md:border-t md:pt-8 border-0 md:relative sticky bottom-0 w-full pb-4 mt-8 rounded-t-lg pt-4 flex gap-2">
          <Button
            size="xl"
            type="submit"
            className="w-full h-[50px] md:w-[30%] mx-auto"
          >
            문의하기
          </Button>
        </div>
      </div>
    </form>
  );
};

export default InquiryForm;
