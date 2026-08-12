"use client";

import useAuthStore from "@/store/authStore";
import useConfirmStore from "@/store/confirmStore";
import { useRouter } from "next/navigation";

const MAKING_PRODUCT_PATH = "/product/author/making-product";
const MAKING_PRODUCT_LOGIN_PATH =
  "/login?redirect=%2Fproduct%2Fauthor%2Fmaking-product";

export default function AuthorStartCta() {
  const router = useRouter();
  const { isAuthInitialized, isAuthenticated } = useAuthStore((state) => ({
    isAuthInitialized: state.isAuthInitialized,
    isAuthenticated: state.isAuthenticated,
  }));
  const { setConfirm } = useConfirmStore();

  const handleRegisterProduct = () => {
    if (!isAuthInitialized) return;

    if (!isAuthenticated) {
      setConfirm({
        content: "이 콘텐츠를 보시려면 로그인이 필요합니다.",
        confirmText: "로그인하기",
        onConfirm: () => {
          window.location.href = MAKING_PRODUCT_LOGIN_PATH;
        },
      });
      return;
    }

    router.push(MAKING_PRODUCT_PATH);
  };

  return (
    <section
      aria-labelledby="author-start-title"
      className="mt-[50px] w-full bg-primary-100 md:mt-[80px]"
    >
      <div className="mx-auto flex max-w-[1120px] flex-col items-center px-16pxr py-[40px] text-center md:px-0 md:py-[60px]">
        <h2
          id="author-start-title"
          className="text-20pxr font-bold leading-[28px] text-white md:text-28pxr md:leading-[36px]"
        >
          25화 쓰고 유료작가에 도전해보세요
        </h2>
        <p className="mt-12pxr text-13pxr leading-[20px] text-white md:text-16pxr md:leading-[24px]">
          라이크노벨에서는 25화 이상 연재하면 표지와 함께 누구나 유료로
          출간할 수 있어요.
        </p>
        <button
          type="button"
          disabled={!isAuthInitialized}
          onClick={handleRegisterProduct}
          className="mt-24pxr min-h-[44px] w-full max-w-[280px] rounded-[14px] bg-white px-32pxr py-12pxr text-14pxr font-semibold text-primary-100 shadow-none transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait md:w-auto md:text-16pxr"
        >
          연재 시작
        </button>
      </div>
    </section>
  );
}
