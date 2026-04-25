"use client";
import Input from "@/components/form/input";
import BirthdateSelector from "@/components/signUp/BirthdateSelector";
import BottomButton from "@/components/signUp/BottomButton";
import LogoButton from "@/components/signUp/LogoButton";
import { SOCIAL_SIGNUP_PENDING_SESSION_KEY } from "@/constants/onboarding";
import useToastStore from "@/store/toastStore";
import { getStateAndReDirectUri } from "@/utils/getStateAndRedirectUri";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import { Controller, FormProvider, useForm } from "react-hook-form";

export interface ISocialAddForm {
  birthDate: string;
  gender: "M" | "F";
}

const SocialAddInform = () => {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");
  const keepSignInValue = searchParams.get("isKeepSignIn");
  const isAgreeToAD = searchParams.get("agreeToAD") === "true" ? true : false;
  const { setToast } = useToastStore();

  const FOURTEEN_YEARS_IN_MS = 14 * 365.25 * 24 * 60 * 60 * 1000;

  const methods = useForm<ISocialAddForm>({
    defaultValues: {
      birthDate: "1980-01-01",
      gender: "M",
    },
  });
  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = methods;

  const getBooleanValue = (value: string | null) => {
    const stringValue = "true";
    const booleanValue = stringValue === "true";
    return booleanValue;
  };

  const getUpdatedState = (
    state: string,
    birthDate: string,
    gender: string
  ) => {
    const prefix = state.charAt(0);
    const updatedState = `${prefix}-${birthDate}-${gender}-likenovel`;
    return updatedState;
  };

  const onSubmit = async (formData: ISocialAddForm) => {
    const { gender } = formData;
    const formattedBirthDate = dayjs(formData.birthDate).format("YYYY-MM-DD");
    if (typeof window !== "undefined") {
      sessionStorage.setItem(SOCIAL_SIGNUP_PENDING_SESSION_KEY, "Y");
    }
    if (provider === "google") {
      const isKeepSignIn = getBooleanValue(keepSignInValue);
      const { state, redirectUri } = getStateAndReDirectUri(
        "google",
        isKeepSignIn,
        false,
        isAgreeToAD
      );
      const updatedState = getUpdatedState(state, formattedBirthDate, gender);
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${updatedState}&scope=email%20profile&prompt=select_account`;
    } else if (provider === "apple") {
      const isKeepSignIn = getBooleanValue(keepSignInValue);
      const { state, redirectUri } = getStateAndReDirectUri(
        "apple",
        isKeepSignIn,
        false,
        isAgreeToAD
      );
      const updatedState = getUpdatedState(state, formattedBirthDate, gender);
      const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
      window.location.href = `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${updatedState}`;
    }
  };

  return (
    <div className="flex justify-center items-start md:items-center h-screen md:bg-[#F9FAFB] overflow-y-auto overflow-x-hidden">
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`relative flex flex-col items-center w-full min-w-[500px] max-w-[640px] h-full md:h-[550px] bg-white rounded-[40px] px-[90px] md:px-[100px] py-30pxr`}
        >
          <div className="md:hidden absolute top-[0px]">
            <div className="flex flex-col items-center">
              <LogoButton />
              <span className="text-20pxr font-bold mt-15pxr">
                {provider === "google" ? "구글" : "애플"}계정으로 가입하기
              </span>
              <span className="text-14pxr text-dark-gray-300">
                아래 입력 항목은 필수 항목입니다.
              </span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center">
            <LogoButton />
            <span className="text-22pxr mt-20pxr font-bold">
              {provider === "google" ? "구글" : "애플"}계정으로 가입하기
            </span>
            <span className="text-14pxr text-dark-gray-300">
              아래 입력 항목은 필수 항목입니다.
            </span>
          </div>
          <div className="w-full mt-[100px] md:mt-30pxr">
            <Controller
              name="birthDate"
              control={control}
              rules={{
                required: "생년월일을 입력해주세요.",
                validate: {
                  isOldEnough: (value) => {
                    const selectedDate = new Date(value);
                    const currentDate = new Date();
                    const ageInMs =
                      currentDate.getTime() - selectedDate.getTime();
                    if (ageInMs < FOURTEEN_YEARS_IN_MS) {
                      setToast({
                        message: "만 14세 미만은 가입이 불가합니다.",
                        type: "error",
                      });
                      return "만 14세 이상만 가입이 가능합니다.";
                    }
                    return true;
                  },
                },
              }}
              render={({ field }) => (
                <BirthdateSelector
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) =>
                    setValue(field.name, date ? date.toString() : "")
                  }
                  errorText={errors.birthDate?.message || ""}
                  isError={!!errors.birthDate}
                />
              )}
            />
            <div className="w-full mt-13pxr">
              <Controller
                name="gender"
                control={control}
                rules={{
                  required: "성별을 선택해주세요.",
                }}
                render={({ field }) => (
                  <Input
                    label="성별"
                    labelStyle="text-14pxr font-semibold"
                    gap="gap-8pxr"
                    options={[
                      { value: "M", label: "남성" },
                      { value: "F", label: "여성" },
                    ]}
                    checkedValue={field.value}
                    onChange={field.onChange}
                    errorText={errors.gender?.message}
                    isError={!!errors.gender}
                  />
                )}
              />
            </div>
          </div>
          <div className="w-full absolute bottom-[30px] px-[90px] md:px-[100px]">
            <BottomButton />
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
export default SocialAddInform;
