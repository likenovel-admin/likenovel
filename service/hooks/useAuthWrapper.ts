import useAuthStore from "@/store/authStore";
import useConfirmStore from "@/store/confirmStore";
import { setLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Hook to wrap functions that require authentication
 * Automatically redirects to login page if not authenticated
 */
export const useAuthWrapper = () => {
  const { isAuthenticated } = useAuthStore();
  const { setConfirm } = useConfirmStore();
  const router = useRouter();

  const withAuth = useCallback(
    <T extends any[], R>(fn: (...args: T) => R | Promise<R>) => {
      return (...args: T): R | Promise<R> | void => {
        // Check authentication status at runtime from both store and storage
        const accessToken =
          localStorage.getItem("access_token") ||
          sessionStorage.getItem("access_token");
        const isAuth = !!accessToken || isAuthenticated;

        if (!isAuth) {
          // Save current page to localStorage before redirecting to login
          const currentPath = window.location.pathname + window.location.search;
          setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, currentPath);

          router.push(`/login?modal=open`, {
            scroll: false,
          });
          return;
        }
        return fn(...args);
      };
    },
    [isAuthenticated, router]
  );

  const withLoginRequired = useCallback(
    <T extends any[], R>(fn: (...args: T) => R | Promise<R>) => {
      return (...args: T): R | Promise<R> | void => {
        // Check authentication status at runtime from both store and storage
        const accessToken =
          localStorage.getItem("access_token") ||
          sessionStorage.getItem("access_token");
        const isAuth = !!accessToken || isAuthenticated;

        if (!isAuth) {
          setConfirm({
            content: "이 콘텐츠를 보시려면 로그인이 필요합니다.",
            confirmText: "로그인하기",
            onConfirm: () => {
              // Save current page to localStorage before redirecting to login
              const currentPath =
                window.location.pathname + window.location.search;
              setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, currentPath);

              window.location.href = `/login?modal=open`;
            },
          });
          return;
        }
        return fn(...args);
      };
    },
    [isAuthenticated, setConfirm]
  );

  return {
    withAuth,
    withLoginRequired,
    isAuthenticated,
  };
};
