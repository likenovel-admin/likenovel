"use client";
import useMediaDevice from "@/hooks/useMediaDevice";
import { useRouter } from "next/navigation";
import FailIcon from "/public/images/fail-icon.svg";

export default function Page() {
  const device = useMediaDevice();
  const router = useRouter();

  const handleRedirectSignup = () => {
    router.push("/sign-up");
  };
  return device === "desktop" ? (
    <div className="min-h-screen flex justify-center items-center bg-[#F9FAFB]">
      <section className="w-full max-w-md">
        <div className="mx-auto rounded-[40px] bg-white w-[500px] h-[469px]">
          <div className="px-[100px] pt-[99px] pb-[109px] text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <FailIcon />
            </div>
            {/* Title & helper */}
            <p className="mt-[33px] text-[22px] leading-[28px] font-bold tracking-[-2%] text-[#111317]">
              회원정보를 찾을 수 없습니다.
            </p>
            <p className="text-[17px] leading-[28px] font-medium  text-[#111317] tracking-[-2%]">
              회원가입해보시는건 어떠실까요?
            </p>

            {/* CTA */}
            <button
              type="button"
              className="mt-[36px] w-[300px] h-[54px] rounded-[10px] bg-[#111317] text-base font-semibold tracking-[-2%] text-white transition active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
              onClick={handleRedirectSignup}
            >
              회원가입하기
            </button>
          </div>
        </div>
      </section>
    </div>
  ) : (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F9FAFB] px-[20px]">
      <div className="flex-1 text-center flex flex-col items-center justify-center">
        <div className="flex justify-center">
          <FailIcon />
        </div>
        {/* Title & helper */}
        <p className="mt-[33px] text-[22px] leading-[28px] font-bold tracking-[-2%] text-[#111317]">
          회원정보를 찾을 수 없습니다.
        </p>
        <p className="text-[17px] leading-[28px] font-medium  text-[#111317] tracking-[-2%]">
          회원가입해보시는건 어떠실까요?
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="mb-[30px] w-full">
        <button
          type="button"
          onClick={handleRedirectSignup}
          className="w-full rounded-2xl bg-[#111317] py-4 text-white text-base font-semibold tracking-[-0.02em] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900"
        >
          회원가입하기
        </button>
      </div>
    </div>
  );
}
