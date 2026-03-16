import useAuthStore from "@/store/authStore";
import useConfirmStore from "@/store/confirmStore";
import {
  removeLocalStorage,
  setLocalStorage,
  STORAGE_KEYS,
} from "@/utils/localStorage";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

interface AuthRedirectOptions<T extends any[]> {
  redirectPath?: string | ((...args: T) => string);
}

/**
 * Hook to wrap functions that require authentication
 * Automatically redirects to login page if not authenticated
 */
export const useAuthWrapper = () => {
  const { isAuthenticated } = useAuthStore();
  const { setConfirm } = useConfirmStore();
  const router = useRouter();

  const getRedirectPath = useCallback(
    <T extends any[]>(
      args: T,
      options?: AuthRedirectOptions<T>
    ): string | null => {
      const redirectPath = options?.redirectPath;
      if (!redirectPath) return null;
      return typeof redirectPath === "function"
        ? redirectPath(...args)
        : redirectPath;
    },
    []
  );

  const getLoginUrl = useCallback((redirectPath?: string | null) => {
    if (!redirectPath) return "/login?modal=open";
    return `/login?modal=open&redirect=${encodeURIComponent(redirectPath)}`;
  }, []);

  const withAuth = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => R | Promise<R>,
      options?: AuthRedirectOptions<T>
    ) => {
      return (...args: T): R | Promise<R> | void => {
        // Check authentication status at runtime from both store and storage
        const accessToken =
          localStorage.getItem("access_token") ||
          sessionStorage.getItem("access_token");
        const isAuth = !!accessToken || isAuthenticated;

        if (!isAuth) {
          const redirectPath = getRedirectPath(args, options);
          const currentPath = window.location.pathname + window.location.search;
          if (redirectPath) {
            removeLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE);
          } else {
            setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, currentPath);
          }

          router.push(getLoginUrl(redirectPath), {
            scroll: false,
          });
          return;
        }
        return fn(...args);
      };
    },
    [getLoginUrl, getRedirectPath, isAuthenticated, router]
  );

  const withLoginRequired = useCallback(
    <T extends any[], R>(
      fn: (...args: T) => R | Promise<R>,
      options?: AuthRedirectOptions<T>
    ) => {
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
              const redirectPath = getRedirectPath(args, options);
              const currentPath =
                window.location.pathname + window.location.search;
              if (redirectPath) {
                removeLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE);
              } else {
                setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, currentPath);
              }

              window.location.href = getLoginUrl(redirectPath);
            },
          });
          return;
        }
        return fn(...args);
      };
    },
    [getLoginUrl, getRedirectPath, isAuthenticated, setConfirm]
  );

  return {
    withAuth,
    withLoginRequired,
    isAuthenticated,
  };
};
