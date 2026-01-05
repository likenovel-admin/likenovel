import useAuthStore from "@/store/authStore";
import axios from "axios";
import { IRefreshTokenRequest } from "../auth/dto";

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
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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
    const originalRequest = error.config;
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

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      const { accessToken, refreshToken, setAccessToken, signOut } =
        useAuthStore.getState();

      // 액세스 토큰 재발급 요청
      if (refreshToken) {
        const transformDataToRequestData = (): IRefreshTokenRequest => {
          return {
            access_token: accessToken || "",
            refresh_token: refreshToken,
          };
        };
        const requestData = transformDataToRequestData();

        try {
          /**
           * 토큰 재발급 요청
           * - 기존 코드는 `axios.put("v1/...")` 형태라 현재 라우트에 상대경로로 붙어 404가 날 수 있습니다.
           * - 반드시 절대경로(`/api/v1/...`)로 호출하여 어떤 페이지에서도 동일하게 동작하도록 합니다.
           */
          const res = await axios.put("/api/v1/command/auth/token/reissue", requestData, {
            withCredentials: true,
          });
          const newAccessToken = res.data.token.access_token;
          if (newAccessToken) {
            setAccessToken(newAccessToken);
            instance.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            return instance(originalRequest);
          } else {
            const currentUrl = encodeURIComponent(window.location.pathname);
            window.location.href = `/login?redirect=${currentUrl}`;
            signOut();
          }
        } catch (error: any) {
          const currentUrl = encodeURIComponent(window.location.pathname);
          window.location.href = `/login?redirect=${currentUrl}`;
          signOut();
        }
      } else {
        const currentUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?redirect=${currentUrl}`;
        signOut();
      }
    }
    return Promise.reject(error);
  }
);
