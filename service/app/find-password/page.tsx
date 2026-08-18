"use client";
import { usePasswordResetSendEmail } from "@/app/api/auth";
import Input from "@/components/form/input";
import HeaderFindId from "@/components/menu/HeaderFindId";
import useMediaDevice from "@/hooks/useMediaDevice";
import useToastStore from "@/store/toastStore";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import LogoIcon from "/public/images/logos/logo-icon.svg";
import Logo from "/public/images/logos/logo.svg";

export default function Page() {
  const device = useMediaDevice();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToast } = useToastStore();
  const [email, setEmail] = useState("");
  const sendResetEmail = usePasswordResetSendEmail();

  // Show toast if there's an error from NICE callback
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "본인인증에 실패했습니다. 다시 시도해주세요.";

      switch (error) {
        case "email_mismatch":
          errorMessage = "이메일 주소를 확인해주세요.";
          break;
        case "user_not_found":
          errorMessage = "해당 정보로 가입된 회원을 찾을 수 없습니다.";
          break;
        case "api_error":
          errorMessage = "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
          break;
        case "decryption_error":
          errorMessage = "본인인증 데이터 처리 중 오류가 발생했습니다.";
          break;
        case "missing_email":
          errorMessage = "이메일 정보가 누락되었습니다. 다시 시도해주세요.";
          break;
        case "missing_data":
          errorMessage = "본인인증 정보가 누락되었습니다. 다시 시도해주세요.";
          break;
      }

      setToast({
        message: errorMessage,
        type: "error",
        duration: 5000,
      });

      // Clean URL by removing error param
      router.replace("/find-password");
    }
  }, [searchParams, setToast, router]);

  const validateEmail = () => {
    if (!email || !email.trim()) {
      setToast({
        message: "이메일 주소를 입력해주세요.",
        type: "error",
        duration: 3000,
      });
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setToast({
        message: "올바른 이메일 형식을 입력해주세요.",
        type: "error",
        duration: 3000,
      });
      return false;
    }
    return true;
  };

  const handleFindPassword = async () => {
    if (!validateEmail()) return;

    try {
      // Save email to session first
      await axios.post(`/api/auth/find-password/save-email`, { email });

      // Get NICE token
      const token_data = await axios
        .post(`/api/auth/find-password`)
        .then((response) => {
          return response.data;
        })
        .catch((error) => {
          console.error(error);
          throw error;
        });

      const form = document.getElementById("form") as HTMLFormElement;
      const left = screen.width / 2 - 500 / 2;
      const top = screen.height / 2 - 800 / 2;
      const option = `status=no, menubar=no, toolbar=no, resizable=no, width=500, height=600, left=${left}, top=${top}`;

      if (form && token_data.data) {
        const { encData, integrityValue, tokenVersionId } = token_data.data;

        window.open("", "nicePopup", option);

        form.target = "nicePopup";
        form.enc_data.value = encData;
        form.token_version_id.value = tokenVersionId;
        form.integrity_value.value = integrityValue;
        form.submit();
      }
    } catch (error: any) {
      setToast({
        message: "본인인증 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        type: "error",
        duration: 3000,
      });
    }
  };

  const handleEmailReset = async () => {
    if (!validateEmail()) return;
    if (sendResetEmail.isPending) return;

    try {
      await sendResetEmail.mutateAsync({ email });
      setToast({
        message:
          "인증메일을 발송했습니다. 메일에서 비밀번호 재설정을 진행해주세요.",
        type: "success",
        duration: 5000,
      });
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        "메일 발송에 실패했습니다. 다시 시도해주세요.";
      setToast({
        message: msg,
        type: "error",
        duration: 5000,
      });
    }
  };

  const EmailResetLink = () => (
    <button
      type="button"
      onClick={handleEmailReset}
      disabled={sendResetEmail.isPending}
      className="w-full h-[54px] rounded-[10px] border border-[#111317] bg-white px-4 py-3 text-base font-semibold tracking-[-2%] text-[#111317] hover:bg-[#F9FAFB] disabled:opacity-50"
    >
      {sendResetEmail.isPending
        ? "발송 중..."
        : "가입 이메일로 재설정 링크 받기"}
    </button>
  );

  return device === "desktop" ? (
    <div className="min-h-screen flex justify-center items-center bg-[#F9FAFB]">
      <section className="w-full max-w-md">
        <div className="mx-auto rounded-[40px] bg-white w-[500px]">
          <div className="px-[100px] py-[76px] text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <button
                className="flex justify-center items-end"
                onClick={() => {
                  router.push("/");
                }}
              >
                <LogoIcon className="w-[30px] h-[38px]" />
                <Logo className="w-[150px] h-[20px]" />
              </button>
            </div>
            {/* Title & helper */}
            <h1 className="mt-[62px] text-xl font-bold tracking-[-2%]">
              비밀번호 찾기
            </h1>
            <p className="mt-[12px] font-normal text-sm leading-[21px] text-[#4D5159] tracking-[-2%]">
              가입 시 등록했던 이메일을 입력 후
              <br />
              본인확인을 해주세요.
            </p>

            <div className="mt-[56px] flex flex-col w-full gap-5pxr">
              <Input
                label="이메일 주소"
                labelStyle="text-sm font-semibold text-left tracking-[-2%] text-[#111317]"
                gap="gap-8pxr"
                inputStyle="w-full h-[44px]"
                placeholder="이메일 주소를 입력하세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <form
              name="form"
              id="form"
              action="https://nice.checkplus.co.kr/CheckPlusSafeModel/service.cb"
            >
              <input type="hidden" id="m" name="m" value="service" />
              <input
                type="hidden"
                id="token_version_id"
                name="token_version_id"
                value=""
              />
              <input type="hidden" id="enc_data" name="enc_data" />
              <input
                type="hidden"
                id="integrity_value"
                name="integrity_value"
              />
            </form>

            {/* CTA */}
            <button
              type="button"
              className="mt-[23px] w-[300px] h-[54px] rounded-[10px] bg-[#111317] px-4 py-3 text-base font-semibold tracking-[-2%] text-white transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
              onClick={handleFindPassword}
            >
              휴대폰 본인 인증 하기
            </button>

            <div className="mt-[12px]">
              <EmailResetLink />
            </div>

            {/* Links */}
            <div className="mt-[16px] flex gap-[22px] justify-center">
              <span className="text-sm font-normal text-[#111317] tracking-[-2%]">
                아이디를 잊으셨나요?
              </span>
              <a
                href="/find-id"
                className="text-sm font-medium text-[#111317] underline underline-offset-2 hover:opacity-80"
              >
                아이디 찾기
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  ) : (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F9FAFB] px-[20px]">
      {/* Top bar */}
      <HeaderFindId />

      {/* Content */}
      <div className="flex-1 text-center w-full">
        <h1 className="mt-[85px] text-2xl font-bold tracking-[-2%] text-[#111317]">
          비밀번호 찾기
        </h1>
        <p className="mt-[12px] text-base tracking-[-2%] text-[#4D5159]">
          가입 시 등록했던 이메일을 입력 후
          <br />
          본인확인을 해주세요.
        </p>

        <div className="mt-[40px] flex flex-col w-full gap-5pxr">
          <Input
            label="이메일 주소"
            labelStyle="text-sm font-semibold text-left tracking-[-2%] text-[#111317]"
            gap="gap-8pxr"
            inputStyle="w-full h-[54px]"
            placeholder="이메일 주소를 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <form
        name="form"
        id="form"
        action="https://nice.checkplus.co.kr/CheckPlusSafeModel/service.cb"
      >
        <input type="hidden" id="m" name="m" value="service" />
        <input
          type="hidden"
          id="token_version_id"
          name="token_version_id"
          value=""
        />
        <input type="hidden" id="enc_data" name="enc_data" />
        <input type="hidden" id="integrity_value" name="integrity_value" />
      </form>

      {/* Bottom CTA */}
      <div className="mb-[60px] w-full">
        <button
          type="button"
          onClick={handleFindPassword}
          className="w-full rounded-2xl bg-[#111317] py-4 text-white text-base font-semibold tracking-[-0.02em] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
        >
          휴대폰 본인 인증 하기
        </button>

        <div className="mt-[12px] text-center">
          <EmailResetLink />
        </div>

        <p className="mt-[30px] flex gap-[19px] justify-center text-sm text-[#111317] tracking-[-0.02em]">
          아이디를 잊으셨나요?
          <a
            href="/find-id"
            className="font-medium underline underline-offset-2"
          >
            아이디 찾기
          </a>
        </p>
      </div>
    </div>
  );
}
