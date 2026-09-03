"use client";

import { useCheckEmail, useEmailSignUp } from "@/app/api/auth";
import { IEmailSignUpRequest } from "@/app/api/auth/dto";
import Spinner from "@/components/common/Spinner";
import BirthdateSelector from "@/components/signUp/BirthdateSelector";
import BottomButton from "@/components/signUp/BottomButton";
import LogoButton from "@/components/signUp/LogoButton";
import { ONBOARDING_FIRST_LOGIN_SESSION_KEY } from "@/constants/onboarding";
import useAuthStore from "@/store/authStore";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import Input from "../../../components/form/input";
import { IForm } from "../page";

const Email = () => {
  const router = useRouter();
  const { signIn } = useAuthStore((state) => ({ signIn: state.signIn }));
  const { mutateAsync: checkEmailMutate, isPending } = useCheckEmail();
  const { mutateAsync: signUpMutate, isPending: isLoading } = useEmailSignUp();
  const savedData =
    typeof window !== "undefined" ? sessionStorage.getItem("formData") : null;
  const defaultValues = savedData ? JSON.parse(savedData) : {};

  const FOURTEEN_YEARS_IN_MS = 14 * 365.25 * 24 * 60 * 60 * 1000;

  const methods = useForm<IForm>({
    shouldFocusError: true,
    defaultValues: {
      ...defaultValues,
      birthDate: "",
      gender: "M",
    },
  });
  const {
    handleSubmit,
    control,
    register,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = methods;

  const [isCheckedEmail, setIsCheckedEmail] = useState(false);

  const onSubmit = async (data: IForm) => {
    const updatedData = { ...defaultValues, ...data };
    sessionStorage.setItem("formData", JSON.stringify(updatedData));
    const storedData = sessionStorage.getItem("formData");
    if (storedData) {
      const formData: IForm = JSON.parse(storedData);
      const requestData: IEmailSignUpRequest =
        transformFormDataToRequestData(formData);
      try {
        const res = await signUpMutate(requestData);
        if (res.data.data) {
          signIn(
            {
              accessToken: res.data.data.auth.accessToken,
              refreshToken: res.data.data.auth.refreshToken,
              expiresIn: res.data.data.auth.accessTokenExpiresIn,
              refreshExpiresIn: res.data.data.auth.refreshTokenExpiresIn,
            },
            res.data.data.auth.recentSignInType,
            {
              userId: res.data.data.auth.userId,
              birthDate: res.data.data.auth.birthDate,
              gender: res.data.data.auth.gender,
            },
            "Y" // Default to keep sign in for new sign-ups
          );
          if (typeof window !== "undefined") {
            sessionStorage.setItem(ONBOARDING_FIRST_LOGIN_SESSION_KEY, "Y");
          }
          router.push("/");
          return;
        }

        // 정상 응답 형태가 아니면 사용자에게 명확히 안내
        setError(
          "email",
          {
            type: "manual",
            message: "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.",
          },
          { shouldFocus: true }
        );
      } catch (error: any) {
        // 서버에서 내려준 message를 우선 노출(예: 409 이미 존재하는 이메일)
        const message =
          error?.response?.data?.message ||
          "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.";

        setIsCheckedEmail(false);
        setError("email", { type: "manual", message }, { shouldFocus: true });
      }
    } else {
      console.error("No form data found in session storage.");
    }
  };

  const onCheckEmail = async (email: string) => {
    try {
      await checkEmailMutate(email);
      setIsCheckedEmail(true);
      clearErrors("email");
      return true;
    } catch (error: any) {
      console.log("error", error);
      setIsCheckedEmail(false);
      setError(
        "email",
        {
          type: "manual",
          message:
            error?.response?.data?.message || "이미 사용중인 이메일입니다.",
        },
        { shouldFocus: true }
      );
      return false;
    }
  };

  const validateEmail = async (email: string) => {
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError(
        "email",
        {
          type: "manual",
          message: "유효한 이메일 주소를 입력해주세요.",
        },
        { shouldFocus: true }
      );
      return false;
    }
    return await onCheckEmail(email);
  };

  const validatePassword = (password: string) => {
    if (
      password.length < 8 ||
      !/[a-zA-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[!@#$%^&*]/.test(password)
    ) {
      return "패스워드는 최소 8자 이상, 영문, 특문, 숫자를 모두 포함해야합니다.";
    }
    return true;
  };

  useEffect(() => {
    setIsCheckedEmail(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch("email")]);

  const transformFormDataToRequestData = (
    formData: IForm
  ): IEmailSignUpRequest => {
    return {
      email: formData.email,
      password: formData.password,
      birthdate: dayjs(formData.birthDate)?.format("YYYY-MM-DD") ?? "",
      gender: formData.gender,
      ad_info_agree_yn: formData.agree.agreeToAD ? "Y" : "N",
    };
  };
  return (
    <div className="flex justify-center items-start md:items-center h-screen md:bg-[#F9FAFB] overflow-y-auto overflow-x-hidden">
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`relative flex flex-col items-center w-full min-w-[300px] max-w-[640px] h-full
           md:h-[790px] bg-white rounded-[40px] px-[16px] md:px-[100px] py-50pxr`}
        >
          <div className="md:hidden absolute top-[0px]">
            <div className="flex flex-col items-center gap-15pxr">
              <LogoButton />
              <span className="text-20pxr font-bold">이메일로 가입하기</span>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-center mb-60pxr">
            <LogoButton />
            <span className="text-20pxr mt-20pxr font-bold">
              이메일로 가입하기
            </span>
          </div>
          <div className="flex flex-col gap-15pxr w-full mt-50pxr md:mt-0">
            <div className="flex items-end w-full">
              <Input
                full
                label="이메일 주소"
                labelStyle="text-14pxr font-semibold"
                gap="gap-8pxr"
                inputStyle="w-full h-[44px]"
                maxLength={100}
                placeholder="이메일 주소를 입력하세요"
                {...register("email", {
                  required: "이메일을 입력해주세요.",
                  validate: async () => {
                    if (!isCheckedEmail) {
                      return "중복확인을 해주세요.";
                    }
                    return true;
                  },
                })}
                isError={!!errors.email}
                errorText={errors.email?.message}
                successText={isCheckedEmail && "사용 가능한 이메일입니다."}
              />
              <button
                type="button"
                className={`w-[75px] h-[44px] bg-black-100 text-white rounded-[6px] text-13pxr font-medium ml-8pxr ${
                  !!errors.email || isCheckedEmail ? "mb-26pxr" : ""
                }`}
                onClick={() => validateEmail(watch("email"))}
                disabled={isPending}
              >
                {isPending ? <Spinner color="#B3B7C3" size={20} /> : "중복확인"}
              </button>
            </div>
            <div className="flex flex-col gap-5pxr">
              <Input
                type="password"
                maxLength={20}
                label="비밀번호"
                labelStyle="text-14pxr font-semibold"
                gap="gap-8pxr"
                inputStyle="w-full h-[44px]"
                placeholder="비밀번호를 입력하세요"
                {...register("password", {
                  required: "패스워드를 입력해주세요.",
                  validate: validatePassword,
                })}
                errorText={errors.password?.message}
                isError={!!errors.password}
              />
              <Input
                type="password"
                maxLength={20}
                inputStyle="w-full h-[44px]"
                placeholder="비밀번호를 다시 한 번 더 입력하세요"
                {...register("confirmPassword", {
                  required: "패스워드를 확인해주세요.",
                  validate: (value) =>
                    value === watch("password") ||
                    "패스워드가 일치하지 않습니다.",
                })}
                errorText={errors.confirmPassword?.message}
                isError={!!errors.confirmPassword}
              />
            </div>
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
                      return "만 14세 이상만 가입이 가능합니다.";
                    }
                    return true;
                  },
                },
              }}
              render={({ field }) => (
                <BirthdateSelector
                  focusRef={field.ref}
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => field.onChange(date.toString())}
                  errorText={errors.birthDate?.message || ""}
                  isError={!!errors.birthDate}
                />
              )}
            />
          </div>
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
          <div className="w-full absolute bottom-[10px] px-[16px] md:px-[100px]">
            <BottomButton isLoading={isLoading} />
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default Email;
