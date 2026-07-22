"use client";
import { useCompleteSocialSignup } from "@/app/api/auth";
import Button from "@/components/common/Button";
import BottomSheetContainer from "@/components/common/BottomSheetContainer";
import ModalContainer from "@/components/common/ModalContainer";
import SocialLoginButton from "@/components/login/SocialLoginButton";
import LogoButton from "@/components/signUp/LogoButton";
import { SOCIAL_SIGNUP_PENDING_SESSION_KEY } from "@/constants/onboarding";
import useMediaDevice from "@/hooks/useMediaDevice";
import useConfirmStore from "@/store/confirmStore";
import useToastStore from "@/store/toastStore";
import { getStateAndReDirectUri } from "@/utils/getStateAndRedirectUri";
import axios from "axios";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import Checkbox from "../../components/common/CheckBox";
import AdPage from "../product/agree/ad/page";
import PrivacyPage from "../product/agree/privacy/page";
import TermsPage from "../product/agree/terms/page";
export interface IForm {
  birthDate: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: string;
  agree: IAgree;
}

interface IAgree {
  agreeToAll: boolean;
  agreeToTerms: boolean;
  agreeToAge: boolean;
  agreeToPrivacy: boolean;
  agreeToAD: boolean;
}

const SignUp = () => {
  const router = useRouter();
  const device = useMediaDevice();
  const searchParams = useSearchParams();
  const { setConfirm } = useConfirmStore();
  const { setToast } = useToastStore();
  const { mutateAsync: completeSocialSignup, isPending: isCompletingSocial } =
    useCompleteSocialSignup();
  const socialPendingToken = searchParams.get("social_pending");
  const socialProvider = searchParams.get("provider") || "";
  const socialProviderLabel =
    {
      naver: "네이버",
      kakao: "카카오",
      google: "구글",
      apple: "Apple",
    }[socialProvider] || "소셜";

  const [openTermsModal, setOpenTermsModal] = useState(false);
  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);
  const [openAdModal, setOpenAdModal] = useState(false);
  const [openSocialTerms, setOpenSocialTerms] = useState(false);
  const pendingSocialRedirectRef = useRef<(() => void) | null>(null);

  const methods = useForm<IForm>({
    defaultValues: {
      agree: {
        agreeToAll: false,
        agreeToTerms: false,
        agreeToAge: false,
        agreeToPrivacy: false,
        agreeToAD: false,
      },
    },
  });
  const { handleSubmit, control, setValue, watch } = methods;

  const agree = useWatch({
    control,
    name: "agree",
  });

  const isSubmitDisabled = useMemo(() => {
    return !(agree.agreeToTerms && agree.agreeToAge && agree.agreeToPrivacy);
  }, [agree.agreeToTerms, agree.agreeToAge, agree.agreeToPrivacy]);

  const syncAgreeToAll = useCallback(() => {
    const { agreeToTerms, agreeToAge, agreeToPrivacy, agreeToAD } = agree;
    const allChecked =
      agreeToTerms && agreeToAge && agreeToPrivacy && agreeToAD;
    setValue("agree.agreeToAll", allChecked);
  }, [agree, setValue]);

  const onSubmit = (data: IForm) => {
    if (isSubmitDisabled) {
      setConfirm({ content: "약관에 동의해주세요.", buttonCount: 1 });
    } else {
      sessionStorage.setItem("formData", JSON.stringify(data));
      router.push("/sign-up/email");
    }
  };

  const handleSocialRedirectRequest = useCallback(
    (continueRedirect: () => void) => {
      if (!isSubmitDisabled) {
        continueRedirect();
        return;
      }
      pendingSocialRedirectRef.current = continueRedirect;
      setOpenSocialTerms(true);
    },
    [isSubmitDisabled]
  );

  const handleContinueSocialSignup = useCallback(() => {
    if (isSubmitDisabled) return;

    const continueRedirect = pendingSocialRedirectRef.current;
    pendingSocialRedirectRef.current = null;
    setOpenSocialTerms(false);
    continueRedirect?.();
  }, [isSubmitDisabled]);

  const handleCompleteSocialSignup = useCallback(async () => {
    if (!socialPendingToken || isSubmitDisabled || isCompletingSocial) return;

    try {
      const response = await completeSocialSignup({
        token: socialPendingToken,
        ad_info_agree_yn: agree.agreeToAD ? "Y" : "N",
      });
      const auth = response.data.data?.auth;
      if (!auth?.snsId || !auth?.tempIssuedKey) {
        throw new Error("missing social relay data");
      }

      sessionStorage.setItem(SOCIAL_SIGNUP_PENDING_SESSION_KEY, "Y");
      const params = new URLSearchParams({
        sns_id: String(auth.snsId),
        temp_issued_key: auth.tempIssuedKey,
        keep_signin_yn: response.data.keep_signin_yn || "Y",
      });
      window.location.href = `/storage-relay?${params.toString()}`;
    } catch (error) {
      if (
        axios.isAxiosError<{ message?: string }>(error) &&
        error.response?.status === 409
      ) {
        const serverMessage = error.response.data?.message;
        if (serverMessage) {
          setToast({ message: serverMessage, type: "error" });
        }
        if (device !== "desktop" && device !== "tablet") {
          window.location.href = "/login";
        } else {
          router.replace("/login?modal=open", { scroll: false });
        }
        return;
      }

      setToast({
        message: "인증 세션이 만료되었습니다. 다시 시도해 주세요.",
        type: "error",
      });
      router.replace("/sign-up");
    }
  }, [
    agree.agreeToAD,
    completeSocialSignup,
    device,
    isCompletingSocial,
    isSubmitDisabled,
    router,
    setToast,
    socialPendingToken,
  ]);

  useEffect(() => {
    syncAgreeToAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    agree.agreeToTerms,
    agree.agreeToAge,
    agree.agreeToPrivacy,
    agree.agreeToAD,
  ]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setToast({
        message: decodeURIComponent(errorParam),
        type: "error",
      });
    }
  }, [searchParams, setToast]);

  useEffect(() => {
    if (!openSocialTerms) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        pendingSocialRedirectRef.current = null;
        setOpenSocialTerms(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [openSocialTerms]);

  const closeSocialTerms = () => {
    pendingSocialRedirectRef.current = null;
    setOpenSocialTerms(false);
  };

  const socialTermsContent = (
    <div className="w-full max-w-[480px] bg-white p-24pxr">
      <h2 className="text-18pxr font-bold tracking-[-2%] text-black-100 mb-20pxr">
        서비스 이용을 위해 약관에 동의해 주세요
      </h2>
      <div className="bg-light-gray-100 border border-light-gray-400 rounded-[8px] p-14pxr mb-16pxr">
        <Controller
          name="agree.agreeToAll"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="전체 동의"
              labelStyle="text-15pxr font-bold text-black-100"
              autoFocus
              {...field}
              checked={field.value}
              onChange={(event) => {
                const checked = event.target.checked;
                setValue("agree.agreeToAll", checked);
                setValue("agree.agreeToTerms", checked);
                setValue("agree.agreeToAge", checked);
                setValue("agree.agreeToPrivacy", checked);
                setValue("agree.agreeToAD", checked);
              }}
            />
          )}
        />
      </div>
      <div className="space-y-14pxr mb-20pxr px-4pxr">
        <div className="flex items-center justify-between">
          <Controller
            name="agree.agreeToTerms"
            control={control}
            render={({ field }) => (
              <Checkbox
                label="이용약관 동의(필수)"
                labelStyle="text-12pxr md:text-14pxr"
                {...field}
                checked={field.value}
              />
            )}
          />
          <button type="button" onClick={() => setOpenTermsModal(true)} className="text-12pxr font-medium tracking-[-2%] text-dark-gray-400 underline">
            내용확인
          </button>
        </div>
        <Controller
          name="agree.agreeToAge"
          control={control}
          render={({ field }) => (
            <Checkbox label="만 14세이상(필수)" labelStyle="text-12pxr md:text-14pxr" {...field} checked={field.value} />
          )}
        />
        <div className="flex items-center justify-between">
          <Controller
            name="agree.agreeToPrivacy"
            control={control}
            render={({ field }) => (
              <Checkbox label="개인정보 수집 및 이용동의(필수)" labelStyle="text-12pxr md:text-14pxr" {...field} checked={field.value} />
            )}
          />
          <button type="button" onClick={() => setOpenPrivacyModal(true)} className="text-12pxr font-medium tracking-[-2%] text-dark-gray-400 underline">
            내용확인
          </button>
        </div>
        <div className="flex items-center justify-between">
          <Controller
            name="agree.agreeToAD"
            control={control}
            render={({ field }) => (
              <Checkbox label="광고성정보 수신동의(선택)" labelStyle="text-12pxr md:text-14pxr" {...field} checked={field.value} />
            )}
          />
          <button type="button" onClick={() => setOpenAdModal(true)} className="text-12pxr font-medium tracking-[-2%] text-dark-gray-400 underline">
            내용확인
          </button>
        </div>
      </div>
      {isSubmitDisabled && (
        <p id="social-terms-error" className="text-12pxr font-medium tracking-[-2%] text-red-100 mb-8pxr px-4pxr">
          필수 약관에 동의해주세요
        </p>
      )}
      <Button
        type="button"
        variant="primary"
        size="lg"
        disabled={isSubmitDisabled}
        aria-describedby="social-terms-error"
        onClick={handleContinueSocialSignup}
        className="w-full h-48pxr rounded-[8px] text-15pxr font-bold tracking-[-2%] disabled:bg-deactivate-color"
      >
        동의하고 계속하기
      </Button>
    </div>
  );

  if (socialPendingToken) {
    return (
      <div className="flex justify-center items-center min-h-screen md:bg-[#F9FAFB] overflow-y-auto overflow-x-hidden">
        <FormProvider {...methods}>
          <main className="flex flex-col items-center w-full min-w-[300px] md:w-[640px] min-h-screen md:min-h-0 bg-white md:rounded-[40px] px-16pxr md:px-120pxr py-24pxr md:py-40pxr">
            <LogoButton />
            <h1 className="mt-24pxr text-18pxr md:text-20pxr font-bold tracking-[-2%] text-black-100 text-center">
              거의 다 왔어요
            </h1>
            <p className="mt-8pxr text-14pxr font-normal tracking-[-2%] text-dark-gray-400 text-center leading-snug break-keep">
              {socialProviderLabel} 계정 확인이 끝났어요. 약관 동의만 하면 바로
              시작할 수 있어요.
            </p>
            <div className="w-full mt-24pxr bg-light-gray-100 border border-light-gray-400 rounded-[8px] p-14pxr flex items-center justify-center gap-8pxr text-14pxr font-medium text-black-100">
              ✓ {socialProviderLabel} 계정 인증 완료
            </div>
            <div className="w-full mt-24pxr border border-light-gray-400 rounded-[10px] p-16pxr space-y-12pxr">
              <Controller
                name="agree.agreeToAll"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="전체 동의"
                    labelStyle="text-14pxr font-semibold"
                    {...field}
                    checked={field.value}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setValue("agree.agreeToAll", checked);
                      setValue("agree.agreeToTerms", checked);
                      setValue("agree.agreeToAge", checked);
                      setValue("agree.agreeToPrivacy", checked);
                      setValue("agree.agreeToAD", checked);
                    }}
                  />
                )}
              />
              <div className="border-t border-light-gray-400" />
              <div className="flex items-center justify-between">
                <Controller
                  name="agree.agreeToTerms"
                  control={control}
                  render={({ field }) => (
                    <Checkbox label="이용약관 동의(필수)" labelStyle="text-12pxr md:text-14pxr" {...field} checked={field.value} />
                  )}
                />
                <button type="button" onClick={() => setOpenTermsModal(true)} className="text-12pxr font-medium text-dark-gray-400 underline">
                  내용확인
                </button>
              </div>
              <Controller
                name="agree.agreeToAge"
                control={control}
                render={({ field }) => (
                  <Checkbox label="만 14세이상(필수)" labelStyle="text-12pxr md:text-14pxr" {...field} checked={field.value} />
                )}
              />
              <div className="flex items-center justify-between">
                <Controller
                  name="agree.agreeToPrivacy"
                  control={control}
                  render={({ field }) => (
                    <Checkbox label="개인정보 수집 및 이용동의(필수)" labelStyle="text-12pxr md:text-14pxr" {...field} checked={field.value} />
                  )}
                />
                <button type="button" onClick={() => setOpenPrivacyModal(true)} className="text-12pxr font-medium text-dark-gray-400 underline">
                  내용확인
                </button>
              </div>
              <div className="flex items-center justify-between">
                <Controller
                  name="agree.agreeToAD"
                  control={control}
                  render={({ field }) => (
                    <Checkbox label="광고성정보 수신동의(선택)" labelStyle="text-12pxr md:text-14pxr" {...field} checked={field.value} />
                  )}
                />
                <button type="button" onClick={() => setOpenAdModal(true)} className="text-12pxr font-medium text-dark-gray-400 underline">
                  내용확인
                </button>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="xl"
              disabled={isSubmitDisabled || isCompletingSocial}
              isLoading={isCompletingSocial}
              aria-disabled={isSubmitDisabled || isCompletingSocial}
              onClick={handleCompleteSocialSignup}
              className="w-full mt-32pxr h-52pxr rounded-[8px] text-16pxr font-bold tracking-[-2%] disabled:bg-deactivate-color"
            >
              동의하고 시작하기
            </Button>
          </main>
        </FormProvider>
        <ModalContainer size="full" isOpen={openTermsModal} onClose={() => setOpenTermsModal(false)}>
          <div className="m-[20px]"><TermsPage /></div>
        </ModalContainer>
        <ModalContainer size="full" isOpen={openPrivacyModal} onClose={() => setOpenPrivacyModal(false)}>
          <div className="m-[20px]"><PrivacyPage /></div>
        </ModalContainer>
        <ModalContainer size="full" isOpen={openAdModal} onClose={() => setOpenAdModal(false)}>
          <div className="m-[20px]"><AdPage /></div>
        </ModalContainer>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen md:bg-[#F9FAFB] overflow-y-auto overflow-x-hidden">
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-center w-full min-w-[300px] md:w-[640px] h-screen md:h-[800px] bg-white rounded-[40px] px-[16px] md:px-[120px] py-0 md:py-30pxr
          "
        >
          <LogoButton />
          <div className="flex justify-center items-center gap-5pxr mt-20pxr md:mt-30pxr">
            <span className="text-18pxr md:text-20pxr font-bold">반가워요</span>
            <Image
              src="/images/hello.png"
              alt="손인사"
              width={30}
              height={38}
              className="w-[20px] h-[20px]"
            />
          </div>
          <div className="flex flex-col items-center text-11pxr md:text-14pxr mt-12pxr">
            <span className="font-light">
              간편 회원가입으로 라이크노벨 서비스를 이용하세요.
            </span>
            <div className="flex">
              <span className="font-light">먼저&nbsp;</span>
              <span className="font-semibold">약관에 동의후 가입</span>
              <span className="font-light">이 가능합니다.</span>
            </div>
          </div>
          <div className="flex flex-col w-full mt-20pxr md:mt-32pxr gap-12pxr">
            <Controller
              name="agree.agreeToAll"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label="약관 전체동의하기"
                  labelStyle="text-12pxr md:text-14pxr font-semibold"
                  checkBoxStyle="w-[22px] h-[22px] border-[2px]"
                  {...field}
                  checked={field.value}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setValue("agree.agreeToAll", checked);
                    setValue("agree.agreeToTerms", checked);
                    setValue("agree.agreeToAge", checked);
                    setValue("agree.agreeToPrivacy", checked);
                    setValue("agree.agreeToAD", checked);
                  }}
                />
              )}
            />
            <div className="w-full border border-t-light-gray-500 border-b-0 border-l-0 border-r-0" />
            <div className="flex justify-between">
              <Controller
                name="agree.agreeToTerms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="이용약관 동의(필수)"
                    labelStyle="text-12pxr md:text-14pxr"
                    checked={field.value}
                    {...field}
                  />
                )}
              />
              <button
                type="button"
                onClick={() => {
                  // router.push("/product/agree/terms");
                  setOpenTermsModal(true);
                }}
              >
                <span className="underline text-12pxr ml-5pxr">내용확인</span>
              </button>
            </div>
            <Controller
              name="agree.agreeToAge"
              control={control}
              render={({ field }) => (
                <Checkbox
                  label="만 14세이상(필수)"
                  labelStyle="text-12pxr md:text-14pxr"
                  checked={field.value}
                  {...field}
                />
              )}
            />
            <div className="flex justify-between">
              <Controller
                name="agree.agreeToPrivacy"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="개인정보 수집 및 이용동의(필수)"
                    labelStyle="text-12pxr md:text-14pxr"
                    checked={field.value}
                    {...field}
                  />
                )}
              />
              <button
                type="button"
                onClick={() => {
                  // router.push("/product/agree/privacy");
                  setOpenPrivacyModal(true);
                }}
              >
                <span className="underline text-12pxr ml-5pxr">내용확인</span>
              </button>
            </div>
            <div className="flex justify-between">
              <Controller
                name="agree.agreeToAD"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="광고성정보 수신동의(선택)"
                    labelStyle="text-12pxr md:text-14pxr"
                    checked={field.value}
                    {...field}
                  />
                )}
              />
              <button
                type="button"
                onClick={() => {
                  // router.push("/product/agree/ad");
                  setOpenAdModal(true);
                }}
              >
                <span className="underline text-12pxr ml-5pxr">내용확인</span>
              </button>
            </div>
          </div>
          <div className="mt-40pxr w-full">
            <SocialLoginButton
              provider={"naver"}
              isSignIn={false}
              isAgreeToAD={watch("agree.agreeToAD")}
              onBeforeRedirect={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem(SOCIAL_SIGNUP_PENDING_SESSION_KEY, "Y");
                }
              }}
              onRedirectRequest={handleSocialRedirectRequest}
            />
          </div>
          <div className="flex justify-center items-center mt-20pxr">
            <SocialLoginButton
              provider={"kakao"}
              isSignIn={false}
              isAgreeToAD={watch("agree.agreeToAD")}
              onBeforeRedirect={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.setItem(SOCIAL_SIGNUP_PENDING_SESSION_KEY, "Y");
                }
              }}
              onRedirectRequest={handleSocialRedirectRequest}
            />
            <div className="h-[12px] border border-l-light-gray-500 border-t-0 border-b-0 border-r-0" />
            <SocialLoginButton
              provider={"google"}
              isSignIn={false}
              isAgreeToAD={watch("agree.agreeToAD")}
              onRedirectRequest={handleSocialRedirectRequest}
              onBeforeRedirect={() => {
                sessionStorage.setItem(SOCIAL_SIGNUP_PENDING_SESSION_KEY, "Y");
              }}
              onGoogleClick={() => {
                const { state, redirectUri } = getStateAndReDirectUri(
                  "google",
                  false,
                  false,
                  watch("agree.agreeToAD")
                );
                const sentinelState = `${state.charAt(0)}-9999-12-31-U-likenovel`;
                const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
                window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${sentinelState}&scope=email%20profile&prompt=select_account`;
              }}
            />
            {/* <div className="h-[12px] border border-l-light-gray-500 border-t-0 border-b-0 border-r-0" /> */}
            {/* <SocialLoginButton
              provider={"apple"}
              isSignIn={false}
              onAppleClick={() => {
                router.push(
                  `/sign-up/social?provider=apple&agreeToAD=${watch(
                    "agree.agreeToAD"
                  )}`
                );
              }}
            /> */}
          </div>
          <div className="flex w-full justify-center items-center gap-20pxr mt-20pxr">
            <div className="w-full border border-t-light-gray-500 border-b-0 border-l-0 border-r-0" />
            <span className="min-w-[30px] text-13pxr text-center text-dark-gray-400">
              또는
            </span>
            <div className="w-full border border-t-light-gray-500 border-b-0 border-l-0 border-r-0" />
          </div>
          <div className="w-full mt-20pxr">
            <Button
              variant="secondary"
              size="xl"
              type="submit"
              className="w-full h-[46px]"
            >
              <span className="text-16pxr font-semibold">
                이메일로 가입하기
              </span>
            </Button>
          </div>
          <div className={`flex items-center mt-30pxr`}>
            <span className="text-11pxr md:text-14pxr">
              이미 라이크노벨 회원이라면?
            </span>
            <button
              type="button"
              className="mb-5pxr md:mb-0"
              onClick={() => {
                if (device !== "desktop" && device !== "tablet") {
                  window.location.href = "/login";
                } else {
                  router.push("/login?modal=open", { scroll: false });
                }
              }}
            >
              <span className="underline text-11pxr md:text-14pxr ml-5pxr font-bold">
                로그인하기
              </span>
            </button>
          </div>
        </form>
      </FormProvider>
      {device === "desktop" || device === "tablet" ? (
        <ModalContainer size="sm" isOpen={openSocialTerms} onClose={closeSocialTerms}>
          {socialTermsContent}
        </ModalContainer>
      ) : (
        <BottomSheetContainer isOpen={openSocialTerms} onClose={closeSocialTerms}>
          {socialTermsContent}
        </BottomSheetContainer>
      )}
      <ModalContainer
        size={"full"}
        isOpen={openTermsModal}
        onClose={() => setOpenTermsModal(false)}
      >
        <div className="m-[20px]">
          <TermsPage />
        </div>
      </ModalContainer>
      <ModalContainer
        size={"full"}
        isOpen={openPrivacyModal}
        onClose={() => setOpenPrivacyModal(false)}
      >
        <div className="m-[20px]">
          <PrivacyPage />
        </div>
      </ModalContainer>
      <ModalContainer
        size={"full"}
        isOpen={openAdModal}
        onClose={() => setOpenAdModal(false)}
      >
        <div className="m-[20px]">
          <AdPage />
        </div>
      </ModalContainer>
    </div>
  );
};

export default SignUp;
