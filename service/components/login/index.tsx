import { useEmailSignIn } from "@/app/api/auth";
import { ISignInRequest } from "@/app/api/auth/dto";
import useAuthStore from "@/store/authStore";
import useToastStore from "@/store/toastStore";
import { SOCIAL_SIGNUP_PENDING_SESSION_KEY } from "@/constants/onboarding";
import { ISocialLoginProvider } from "@/types";
import { getStateAndReDirectUri } from "@/utils/getStateAndRedirectUri";
import {
  getLocalStorage,
  removeLocalStorage,
  setLocalStorage,
  STORAGE_KEYS,
} from "@/utils/localStorage";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Button from "../common/Button";
import Checkbox from "../common/CheckBox";
import ErrorSpan from "../common/ErrorSpan";
import Input from "../form/input";
import SocialLoginButton from "./SocialLoginButton";
import ArrowRight from "/public/images/arrow-right-medium.svg";
import Close from "/public/images/close.svg";
import LogoIcon from "/public/images/logos/logo-icon.svg";
import Logo from "/public/images/logos/logo.svg";

export interface ILoginForm {
  email: string;
  password: string;
  isKeepSignIn: boolean;
}

interface Props {
  pageType: "modal" | "mobile" | "desktop";
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

const Login = ({ pageType, setIsOpen }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const methods = useForm<ILoginForm>({
    defaultValues: {
      isKeepSignIn: true,
    },
  });
  const { signIn } = useAuthStore((state) => ({ signIn: state.signIn }));
  const { mutateAsync: signInMutate, isPending } = useEmailSignIn();
  const { setToast } = useToastStore();

  const {
    handleSubmit,
    register,
    control,
    watch,
    formState: { errors },
  } = methods;

  const [isValidAll, setIsValidAll] = useState<boolean | null>(null);
  const [recentLoginType, setRecentLoginType] = useState<
    "" | ISocialLoginProvider
  >("");

  const validateEmail = (email: string) => {
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return false;
    }
    return true;
  };

  const calculateIsAdult = (birthDate: string) => {
    const currentYear = new Date().getFullYear();
    const birthYear = new Date(birthDate).getFullYear();
    return currentYear - birthYear >= 19;
  };

  const transformFormDataToRequestData = (
    formData: ILoginForm
  ): ISignInRequest => {
    return {
      email: formData.email,
      password: formData.password,
      keep_signin_yn: formData.isKeepSignIn ? "Y" : "N",
    };
  };

  const onSubmit = async (formData: ILoginForm) => {
    // Reset error state before attempting login
    setIsValidAll(null);

    try {
      const requestData: ISignInRequest =
        transformFormDataToRequestData(formData);
      const res = await signInMutate(requestData);
      if (res.data.data) {
        // API returns updated recentSignInType which will be synced by useInitializeAuth
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
          requestData.keep_signin_yn
        );

        // Invalidate user query to fetch fresh userRole from API
        queryClient.invalidateQueries({ queryKey: ["selectUser"] });

        setIsOpen?.(false);

        // Check for previous page in localStorage first, then redirect URL in search params
        const previousPage = getLocalStorage<string>(
          STORAGE_KEYS.PREVIOUS_PAGE
        );
        const redirectUrl = searchParams.get("redirect");
        if (previousPage) {
          // Remove previous page from localStorage after using it
          removeLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE);
          router.push(previousPage, { scroll: false });
        } else if (redirectUrl) {
          router.push(decodeURIComponent(redirectUrl), { scroll: false });
        } else {
          router.push("/");
        }
      }
    } catch (error: any) {
      setIsValidAll(false);
    }
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

  const onGoogleLogin = async () => {
    const isKeepSignIn = watch("isKeepSignIn");

    const { state, redirectUri } = getStateAndReDirectUri(
      "google",
      isKeepSignIn,
      true
    );
    const updatedState = getUpdatedState(state, "1900-01-01", "M");
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${updatedState}&scope=email%20profile&prompt=select_account`;
  };

  const prepareSocialLoginRedirect = () => {
    sessionStorage.removeItem(SOCIAL_SIGNUP_PENDING_SESSION_KEY);
    const redirectUrl = searchParams.get("redirect");
    if (
      redirectUrl?.startsWith("/")
      && !redirectUrl.startsWith("//")
      && !redirectUrl.includes("\\")
    ) {
      setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, redirectUrl);
    }
  };

  // const onAppleLogin = async () => {
  //   const isKeepSignIn = watch("isKeepSignIn");
  //   // Save before redirect
  //   saveRecentSignInType("apple");
  //   const { state, redirectUri } = getStateAndReDirectUri(
  //     "apple",
  //     isKeepSignIn,
  //     true
  //   );
  //   const updatedState = getUpdatedState(state, "1900-01-01", "M");
  //   const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  //   window.location.href = `https://appleid.apple.com/auth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${updatedState}`;
  // };

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SOCIAL_SIGNUP_PENDING_SESSION_KEY);
    }

    const storedLoginType = localStorage.getItem("recent_sign_in_type");
    if (storedLoginType) {
      setRecentLoginType(storedLoginType as ISocialLoginProvider);
    }

    // Check for error in URL query params and show toast
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setToast({
        message: decodeURIComponent(errorParam),
        type: "error",
      });
    }
  }, [searchParams, setToast]);

  useEffect(() => {
    if (errors.email || errors.password) {
      setIsValidAll(false);
    }
    // Don't reset isValidAll here - let it stay false if API returned error
    // Only reset when user changes input (handled in watch effect below)
  }, [errors]);

  // Reset error when user changes input
  useEffect(() => {
    const subscription = watch(() => {
      if (isValidAll === false) {
        setIsValidAll(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isValidAll]);

  return (
    <div
      className={`relative w-full flex flex-col items-center ${
        pageType === "modal"
          ? "px-24pxr pb-16pxr pt-0 md:px-32pxr"
          : "h-screen justify-center md:justify-start min-w-[300px] max-w-[700px] px-16pxr md:px-90pxr"
      }`}
    >
      {pageType === "mobile" && (
        <button
          onClick={() => {
            router.back();
          }}
          className="absolute top-[20px] right-[20px]"
        >
          <Close className="w-[15px] h-[15px]" />
        </button>
      )}
      <button
        className={`flex justify-center items-end gap-12pxr ${
          pageType === "modal" ? "mb-18pxr" : "mb-50pxr mt-20pxr"
        }`}
        onClick={() => {
          setIsOpen?.(false);
          router.push("/");
        }}
      >
        <LogoIcon className="w-[30px] h-[38px]" />
        <Logo className="w-[150px] h-[20px]" />
      </button>

      <form
        onSubmit={handleSubmit(onSubmit, (errors) => {
          if (errors.email || errors.password) {
            setIsValidAll(false);
          }
        })}
        className="w-full"
      >
        <div className="flex flex-col w-full gap-5pxr">
          <Input
            autoFocus={pageType === "modal"}
            label="이메일"
            labelStyle="text-14pxr font-semibold"
            gap="gap-8pxr"
            inputStyle={
              pageType === "modal" ? "w-full h-[44px]" : "w-full h-[52px]"
            }
            placeholder="이메일 주소를 입력하세요"
            maxLength={100}
            {...register("email", {
              required: true,
              validate: validateEmail,
            })}
          />
          <Input
            type="password"
            maxLength={20}
            label="비밀번호"
            labelStyle="text-14pxr font-semibold"
            gap="gap-8pxr"
            inputStyle={
              pageType === "modal" ? "w-full h-[44px]" : "w-full h-[52px]"
            }
            placeholder="비밀번호를 입력하세요"
            {...register("password", { required: true })}
          />
          <div
            className={
              pageType === "modal"
                ? "flex flex-col items-start gap-8pxr min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between"
                : "flex items-center justify-between"
            }
          >
            <Controller
              name="isKeepSignIn"
              control={control}
              defaultValue={true}
              render={({ field }) => (
                <Checkbox
                  label="로그인 유지"
                  labelStyle="text-14pxr"
                  checked={field.value}
                  {...field}
                />
              )}
            />
            <div className="flex items-center gap-8pxr">
              <button
                className="text-14pxr"
                type="button"
                onClick={() => {
                  window.location.href = "/find-id";
                }}
              >
                아이디 찾기
              </button>
              <span aria-hidden="true" className="text-14pxr text-dark-gray-100">
                |
              </span>
              <button
                className="flex items-center gap-9pxr"
                type="button"
                onClick={() => {
                  window.location.href = "/find-password";
                }}
              >
                <span className="text-14pxr">비밀번호 재설정</span>
                <ArrowRight className="w-[12px] h-[12px]" />
              </button>
            </div>
          </div>
        </div>

        {isValidAll === false && (
          <div className="mt-10pxr">
            <ErrorSpan spanStyle="text-14pxr ml-5pxr">
              이메일 또는 비밀번호를 확인해주세요.
            </ErrorSpan>
          </div>
        )}

        <div
          className={`w-full ${
            pageType === "modal" ? "mt-18pxr" : "mt-37pxr"
          }`}
        >
          <Button
            size="xl"
            type="submit"
            className={pageType === "modal" ? "h-[46px] w-full" : "h-[50px] w-full"}
            isLoading={isPending}
            disabled={isPending}
          >
            이메일로 로그인
          </Button>
        </div>
      </form>

      <div
        className={`flex w-full flex-col items-center ${
          pageType === "modal" ? "mt-18pxr" : "mt-40pxr"
        }`}
      >
        <div className="flex w-full items-center gap-12pxr">
          <div className="h-px flex-1 bg-light-gray-500" />
          <span className="text-13pxr text-dark-gray-400">
            SNS로 계속하기
          </span>
          <div className="h-px flex-1 bg-light-gray-500" />
        </div>

        <div className="mt-14pxr flex w-full flex-col gap-8pxr">
          <SocialLoginButton
            provider={"kakao"}
            fullWidth
            isRecentSingIn={recentLoginType === "kakao"}
            isKeepSignIn={watch("isKeepSignIn")}
            onBeforeRedirect={prepareSocialLoginRedirect}
          />

          <SocialLoginButton
            provider={"naver"}
            fullWidth
            isRecentSingIn={recentLoginType === "naver"}
            isKeepSignIn={watch("isKeepSignIn")}
            onBeforeRedirect={prepareSocialLoginRedirect}
          />

          <SocialLoginButton
            provider={"google"}
            fullWidth
            isRecentSingIn={recentLoginType === "google"}
            isKeepSignIn={watch("isKeepSignIn")}
            onBeforeRedirect={prepareSocialLoginRedirect}
            onGoogleClick={() => {
              onGoogleLogin();
            }}
          />

        </div>
      </div>

      <div
        className={`flex items-center ${
          pageType === "modal"
            ? "mt-18pxr flex-col gap-4pxr min-[360px]:flex-row min-[360px]:gap-0"
            : "mt-30pxr"
        }`}
      >
        <span className="text-14pxr">아직도 라이크노벨 회원이 아니세요?</span>
        <button
          onClick={() => {
            setIsOpen?.(false);
            router.push("/sign-up");
          }}
        >
          <span
            className={`underline text-14pxr ${
              pageType === "modal"
                ? "ml-0 min-[360px]:ml-5pxr"
                : "ml-5pxr"
            }`}
          >
            회원가입
          </span>
        </button>
      </div>
    </div>
  );
};

export default Login;
