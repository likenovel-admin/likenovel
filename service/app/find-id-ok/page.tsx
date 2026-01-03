"use client";
import useMediaDevice from "@/hooks/useMediaDevice";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import UnionIcon from "/public/images/union-icon.svg";

function FindIdOkContent() {
  const device = useMediaDevice();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";

  const handleRedirectLogin = () => {
    window.location.href = "/login";
  };
  return device === "desktop" ? (
    <div className="min-h-screen flex justify-center items-center bg-[#F9FAFB]">
      <section className="w-full max-w-md">
        <div className="mx-auto rounded-[40px] bg-white w-[500px] h-[469px]">
          <div className="px-[100px] pt-[96px] pb-[69px] text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <UnionIcon />
            </div>
            {/* Title & helper */}
            <p className="mt-[24px] text-sm font-semibold tracking-[-2%] text-[#176BF2]">
              아이디를 찾았습니다.
            </p>
            <p className="mt-[5px] text-[22px] font-bold text-[#111317] tracking-[-2%]">
              {email
                ? // maskEmail(email)
                  email
                : ""}
            </p>
            <p className="mt-[28px] font-normal text-sm leading-[21px] text-[#4D5159] tracking-[-2%]">
              개인정보 보호를 위 뒷자리는 ****으로 표시됩니다.
              <br />
              전체 아이디를 찾기를 원하시면 문의를 남겨 주세요.
            </p>

            {/* CTA */}
            <button
              type="button"
              className="mt-[24px] w-[300px] h-[54px] rounded-[10px] bg-[#111317] text-base font-semibold tracking-[-2%] text-white transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
              onClick={handleRedirectLogin}
            >
              로그인하기
            </button>
          </div>
        </div>
      </section>
    </div>
  ) : (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F9FAFB] px-[20px]">
      <div className="flex-1 text-center flex flex-col items-center justify-center">
        <div className="flex justify-center">
          <UnionIcon />
        </div>
        <p className="mt-[24px] text-sm font-semibold tracking-[-2%] text-[#176BF2]">
          아이디를 찾았습니다.
        </p>
        <p className="mt-[5px] text-[22px] font-bold text-[#111317] tracking-[-2%]">
          {/* {maskEmail(email)} */}
          {email}
        </p>
        <p className="mt-[28px] font-normal text-sm leading-[21px] text-[#4D5159] tracking-[-2%]">
          개인정보 보호를 위 뒷자리는 ****으로 표시됩니다.
          <br />
          전체 아이디를 찾기를 원하시면 문의를 남겨 주세요.
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="mb-[30px] w-full">
        <button
          type="button"
          onClick={handleRedirectLogin}
          className="w-full rounded-2xl bg-[#111317] py-4 text-white text-base font-semibold tracking-[-0.02em] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
        >
          로그인하기
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FindIdOkContent />
    </Suspense>
  );
}
