import useAuthStore, { isCurrentAuthSession } from "@/store/authStore";
import {
  clearAuthorizationHeaders,
  clearStaleAuthSession,
} from "@/utils/authSession";
import { reportServiceUnavailable } from "@/utils/serviceAvailability";
import axios, { type AxiosRequestConfig } from "axios";
import { IRefreshTokenRequest } from "../auth/dto";

export type AxiosRequestConfigWithAuthBypass = AxiosRequestConfig & {
  _retry?: boolean;
  _authSessionVersion?: number;
  skipAuthRedirectOn401?: boolean;
  reportGlobalServiceUnavailable?: boolean;
};

export const requiredServiceRequestConfig: AxiosRequestConfigWithAuthBypass = {
  reportGlobalServiceUnavailable: true,
};

const API_TIMEOUT_MS = 3 * 60 * 1000;

export const instance = axios.create({
  baseURL: "/api",
  timeout: API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    // "Access-Control-Allow-Credentials": "true",
    // "Access-Control-Allow-Methods": "GET,DELETE,PATCH,POST,PUT",
  },
  withCredentials: true,
});

// Public instance without authentication
export const publicInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_SERVER_URI,
  timeout: API_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// One refresh per session; an older session's completion cannot clear a newer one.
let pendingTokenRefresh: {
  sessionVersion: number;
  promise: Promise<boolean>;
} | undefined;

const refreshAuthSession = (sessionVersion: number) => {
  if (pendingTokenRefresh?.sessionVersion === sessionVersion) {
    return pendingTokenRefresh.promise;
  }
  const { accessToken, refreshToken, setAccessToken, setRefreshToken } =
    useAuthStore.getState();
  const promise: Promise<boolean> = axios.put("/api/v1/command/auth/token/reissue", {
    access_token: accessToken || "",
    refresh_token: refreshToken,
  }, { withCredentials: true, timeout: API_TIMEOUT_MS }).then((res) => {
    if (!isCurrentAuthSession(sessionVersion)) return false;
    const newAccessToken =
      res?.data?.data?.token?.accessToken ||
      res?.data?.data?.auth?.accessToken ||
      res?.data?.token?.access_token ||
      res?.data?.token?.accessToken;
    const newRefreshToken =
      res?.data?.data?.token?.refreshToken ||
      res?.data?.data?.auth?.refreshToken ||
      res?.data?.token?.refresh_token ||
      res?.data?.token?.refreshToken;
    if (!newAccessToken) return false;
    setAccessToken(newAccessToken);
    if (newRefreshToken) {
      setRefreshToken(newRefreshToken);
    }
    instance.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
    return true;
  }).finally(() => {
    if (pendingTokenRefresh?.promise === promise) pendingTokenRefresh = undefined;
  });
  pendingTokenRefresh = { sessionVersion, promise };
  return promise;
};

instance.interceptors.request.use(
  (config) => {
    const authConfig = config as AxiosRequestConfigWithAuthBypass;
    if (authConfig._authSessionVersion === undefined) {
      authConfig._authSessionVersion = useAuthStore.getState().authSessionVersion;
    } else if (!isCurrentAuthSession(authConfig._authSessionVersion)) {
      // A replay must not inherit a different account's bearer token.
      const canceled = new axios.CanceledError("Authentication session changed");
      canceled.config = config;
      throw canceled;
    }
    // Check both localStorage and sessionStorage for access token
    const accessToken =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    /**
     * Authorization 헤더 동기화(Defensive)
     * - 토큰이 없는데도 axios defaults에 Authorization이 남아있으면(이전 세션/로그아웃/재발급 실패 후)
     *   로그인 페이지에서도 잘못된 Bearer가 전송되어 401 루프(→ reissue → stale auth cleanup)가 발생할 수 있습니다.
     * - 토큰이 있으면 설정, 없으면 헤더/기본값을 반드시 제거합니다.
     */
    if (accessToken) {
      // Set header on this request
      (config.headers as any).Authorization = `Bearer ${accessToken}`;
    } else {
      // Remove stale headers (AxiosHeaders / plain object 모두 대응)
      try {
        if (typeof (config.headers as any)?.delete === "function") {
          (config.headers as any).delete("Authorization");
        } else {
          delete (config.headers as any)?.Authorization;
          delete (config.headers as any)?.authorization;
        }
      } catch (e) {
        console.error("[auth] Failed to clear request Authorization header:", e);
      }

      try {
        delete (instance.defaults.headers.common as any).Authorization;
        delete (instance.defaults.headers.common as any).authorization;
      } catch (e) {
        console.error("[auth] Failed to clear axios default Authorization header:", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/*
 * 이 함수는 응답값을 가로채어 특정 상황에 부합하는지 검토합니다.
 * - Http status가 401이면서 에러코드가 E4010일시 기존의 리프레시 토큰을 이용해 엑세스 토큰을 재발급 합니다.
 */
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = (error.config || {}) as AxiosRequestConfigWithAuthBypass;
    const belongsToCurrentSession = () =>
      originalRequest._authSessionVersion === undefined ||
      isCurrentAuthSession(originalRequest._authSessionVersion);
    // Keep the original failure for the caller, but never let an old request
    // refresh/clear the new session or trigger the global maintenance signal.
    if (!belongsToCurrentSession()) {
      return Promise.reject(error);
    }
    reportServiceUnavailable(
      error,
      originalRequest.reportGlobalServiceUnavailable === true
    );
    // if (
    //   error.response &&
    //   error.response.status === 401 &&
    //   (error.response.data?.code === ErrorCodes.E4010 ||
    //     error.response.data?.code === ErrorCodes.E4011 ||
    //     error.response.data?.code === ErrorCodes.E4012) &&
    //   !originalRequest._retry
    // ) {
    //   originalRequest._retry = true;

    //   const { accessToken, refreshToken, setAccessToken, signOut } =
    //     useAuthStore.getState();

    //   if (error.response.data?.code === ErrorCodes.E4010) {
    //     // 액세스 토큰 재발급 요청
    //     if (refreshToken) {
    //       const transformDataToRequestData = (): IRefreshTokenRequest => {
    //         return {
    //           access_token: accessToken || "",
    //           refresh_token: refreshToken,
    //         };
    //       };
    //       const requestData = transformDataToRequestData();

    //       try {
    //         const res = await instance.put(
    //           "v1/command/auth/token/reissue",
    //           requestData
    //         );
    //         const newAccessToken = res.data.token.access_token;
    //         if (newAccessToken) {
    //           setAccessToken(newAccessToken);
    //           instance.defaults.headers.common[
    //             "Authorization"
    //           ] = `Bearer ${newAccessToken}`;
    //           originalRequest.headers[
    //             "Authorization"
    //           ] = `Bearer ${newAccessToken}`;
    //           return instance(originalRequest);
    //         } else {
    //           const currentUrl = encodeURIComponent(window.location.pathname);
    //           window.location.href = `/login?redirect=${currentUrl}`;
    //           signOut();
    //         }
    //       } catch (error: any) {
    //         const currentUrl = encodeURIComponent(window.location.pathname);
    //         window.location.href = `/login?redirect=${currentUrl}`;
    //         signOut();
    //       }
    //     } else {
    //       const currentUrl = encodeURIComponent(window.location.pathname);
    //       window.location.href = `/login?redirect=${currentUrl}`;
    //       signOut();
    //     }
    //   } else if (error.response.data?.code === ErrorCodes.E4011) {
    //     // 리프레시 토큰 만료로 인한 로그인 필요
    //     const currentUrl = encodeURIComponent(window.location.pathname);
    //     window.location.href = `/login?redirect=${currentUrl}`;
    //     signOut();
    //   } else if (error.response.data?.code === ErrorCodes.E4012) {
    //     // 본인인증 필요
    //     //window.location.href = "/"; // 페이지 url 추가 필
    //   }
    // }

    // Check if the request is a login/signup endpoint
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/signin") ||
      originalRequest.url?.includes("/auth/signup");

    if (error.response?.status === 401 && originalRequest.skipAuthRedirectOn401) {
      return Promise.reject(error);
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      const { accessToken, refreshToken, authSessionVersion, setState } =
        useAuthStore.getState();
      // A late 401 may refer to the token another request has already rotated.
      if (accessToken && originalRequest.headers?.Authorization !== `Bearer ${accessToken}`) {
        return instance(originalRequest);
      }

      const clearStaleAuth = () => {
        clearStaleAuthSession({
          localStorage,
          sessionStorage,
          authorizationHeaders: instance.defaults.headers.common,
        });
        clearAuthorizationHeaders(originalRequest.headers as any);
        setState({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
        });
      };

      // refresh token이 있으면 재발급 시도
      if (refreshToken) {
        try {
          const refreshed = await refreshAuthSession(authSessionVersion);
          if (!belongsToCurrentSession()) {
            return Promise.reject(error);
          }
          if (refreshed) return instance(originalRequest);
        } catch (refreshError) {
          if (!belongsToCurrentSession()) {
            return Promise.reject(refreshError);
          }
          if (reportServiceUnavailable(refreshError, true)) {
            return Promise.reject(refreshError);
          }
        }

        // 재발급 실패 → stale auth만 정리 후 로그인 리다이렉트
        clearStaleAuth();
        const currentUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?redirect=${currentUrl}`;
        // 리다이렉트 중 컴포넌트에 에러 전파 방지
        return new Promise(() => {});
      } else {
        // refresh token 없음 → stale 토큰 정리 후 로그인으로 1회 이동
        clearStaleAuth();
        if (window.location.pathname.startsWith("/login")) {
          return Promise.reject(error);
        }
        const currentUrl = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.href = `/login?redirect=${currentUrl}`;
        return new Promise(() => {});
      }
    }
    return Promise.reject(error);
  }
);
