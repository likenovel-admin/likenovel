"use client";
import Button from "@/components/common/Button";
import ModalContainer from "@/components/common/ModalContainer";
import SocialLoginButton from "@/components/login/SocialLoginButton";
import LogoButton from "@/components/signUp/LogoButton";
import { SOCIAL_SIGNUP_PENDING_SESSION_KEY } from "@/constants/onboarding";
import useMediaDevice from "@/hooks/useMediaDevice";
import useConfirmStore from "@/store/confirmStore";
import useToastStore from "@/store/toastStore";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import Checkbox from "../../components/common/CheckBox";
import AdPage from "../product/agree/ad/page";
import PrivacyPage from "../product/agree/privacy/page";
import TermsPage from "../product/agree/terms/page";
import ArrowRight from "/public/images/arrow-right-medium.svg";
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

  const [openTermsModal, setOpenTermsModal] = useState(false);
  const [openPrivacyModal, setOpenPrivacyModal] = useState(false);
  const [openAdModal, setOpenAdModal] = useState(false);

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
              disabled={isSubmitDisabled}
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
              disabled={isSubmitDisabled}
            />
            <div className="h-[12px] border border-l-light-gray-500 border-t-0 border-b-0 border-r-0" />
            <SocialLoginButton
              provider={"google"}
              isSignIn={false}
              disabled={isSubmitDisabled}
              onGoogleClick={() => {
                router.push(
                  `/sign-up/social?provider=google&agreeToAD=${watch(
                    "agree.agreeToAD"
                  )}`
                );
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
          <div className="mt-10pxr">
            <button className="flex items-center gap-9pxr" type="button">
              <span className="text-11pxr md:text-14pxr">
                CP 입점/편집자라면?
              </span>
              <ArrowRight className="w-[10px] md:w-[12px] h-[10px] md:h-[12px]" />
            </button>
          </div>
        </form>
      </FormProvider>
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
