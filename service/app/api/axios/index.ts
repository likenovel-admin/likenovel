import useAuthStore from "@/store/authStore";
import axios from "axios";
import { IRefreshTokenRequest } from "../auth/dto";

type AxiosRequestConfigWithAuthBypass = {
  _retry?: boolean;
  skipAuthRedirectOn401?: boolean;
  headers?: Record<string, any>;
  url?: string;
};

export const instance = axios.create({
  baseURL: "/api",
  timeout: 3 * 60 * 1000,
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
  timeout: 3 * 60 * 1000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

instance.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for access token
    const accessToken =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    /**
     * Authorization 헤더 동기화(Defensive)
     * - 토큰이 없는데도 axios defaults에 Authorization이 남아있으면(이전 세션/로그아웃/재발급 실패 후)
     *   로그인 페이지에서도 잘못된 Bearer가 전송되어 401 루프(→ reissue → signOut)가 발생할 수 있습니다.
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

      const { accessToken, refreshToken, setAccessToken, signOut, isAuthenticated } =
        useAuthStore.getState();

      const clearStaleAuth = () => {
        try {
          delete (instance.defaults.headers.common as any).Authorization;
          delete (originalRequest.headers as any)?.Authorization;
          delete (originalRequest.headers as any)?.authorization;
        } catch (_) {}
        signOut();
      };

      // refresh token이 있으면 재발급 시도
      if (refreshToken) {
        try {
          const res = await axios.put("/api/v1/command/auth/token/reissue", {
            access_token: accessToken || "",
            refresh_token: refreshToken,
          }, { withCredentials: true });

          const newAccessToken =
            res?.data?.data?.token?.accessToken ||
            res?.data?.data?.auth?.accessToken ||
            res?.data?.token?.access_token ||
            res?.data?.token?.accessToken;

          if (newAccessToken) {
            setAccessToken(newAccessToken);
            instance.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
            const requestHeaders = originalRequest.headers ?? (originalRequest.headers = {});
            requestHeaders["Authorization"] = `Bearer ${newAccessToken}`;
            return instance(originalRequest);
          }
        } catch (_) {}

        // 재발급 실패 → 로그아웃 후 로그인 리다이렉트
        clearStaleAuth();
        const currentUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?redirect=${currentUrl}`;
        // 리다이렉트 중 컴포넌트에 에러 전파 방지
        return new Promise(() => {});
      } else {
        // refresh token 없음 → stale 토큰 정리 후 비로그인으로 페이지 리로드
        clearStaleAuth();
        window.location.reload();
        return new Promise(() => {});
      }
    }
    return Promise.reject(error);
  }
);
