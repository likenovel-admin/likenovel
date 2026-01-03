"use client";
import { useRouter } from "next/navigation";
import ArrowLeft from "/public/images/arrow-left-medium.svg";
import LogoIcon from "/public/images/logos/logo-icon.svg";
import Logo from "/public/images/logos/logo.svg";

export default function HeaderFindId() {
  const router = useRouter();
  return (
    <header className="w-full py-[12px]">
      <div className="flex justify-center items-center gap-2 relative">
        <button
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="w-[12px] absolute left-0 top-[50%] translate-y-[-50%]"
        >
          {/* Arrow Left */}
          <ArrowLeft />
        </button>

        <button
          onClick={() => router.push("/")}
          className="flex items-end gap-2"
          aria-label="홈으로"
        >
          <LogoIcon className="w-[30px] h-[38px]" />
          <Logo className="w-[150px] h-[20px]" />
        </button>
      </div>
    </header>
  );
}
