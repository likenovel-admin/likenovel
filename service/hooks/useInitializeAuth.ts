"use client";
import { useSelectUser } from "@/app/api/auth";
import useAuthStore from "@/store/authStore";
import { useEffect } from "react";

const useInitializeAuth = () => {
  const { setState } = useAuthStore();
  const { data } = useSelectUser();

  useEffect(() => {
    // Check both localStorage and sessionStorage for tokens
    const accessToken =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token");
    const refreshToken =
      localStorage.getItem("refresh_token") ||
      sessionStorage.getItem("refresh_token");
    const storedUser = sessionStorage.getItem("user");

    /**
     * 인증 상태 초기화(Defensive)
     * - access_token이 없는 상태에서 sessionStorage의 user만 남아있으면,
     *   UI가 "로그인된 것처럼" 오판하여 인증 API를 호출 → 401/재발급 루프가 발생할 수 있습니다.
     * - 토큰이 없으면 user도 함께 비웁니다.
     */
    if (!accessToken && storedUser) {
      try {
        sessionStorage.removeItem("user");
      } catch (e) {
        console.error(
          "[auth] Failed to remove stale user from sessionStorage:",
          e
        );
      }
    }

    setState({
      isAuthInitialized: true,
      isAuthenticated: !!accessToken,
      user: accessToken && storedUser ? JSON.parse(storedUser) : null,
      accessToken,
      refreshToken,
    });
  }, [setState]);

  useEffect(() => {
    if (data === undefined) return;

    /**
     * 서버 유저 동기화(Defensive)
     * - 백엔드 `/v1/query/user`는 비로그인 상태에서도 200 + 빈 data({})를 반환할 수 있습니다.
     * - 이 경우 user를 저장해버리면(sessionStorage.user가 항상 생김) "유령 로그인 상태"가 되어
     *   로그인 페이지에서도 401/재발급 루프가 발생할 수 있습니다.
     * - 실제 userId가 있을 때만 user를 저장합니다.
     */
    if (data?.data?.userId) {
      const user = {
        userId: data.data.userId,
        birthDate: data.data.birthDate,
        gender: data.data.gender,
        isAdult: data.data.adultToggleDisplayYn === "Y",
        userRole: data.data.userRole,
      };

      setState({ user });

      // Sync recent_sign_in_type from server if different
      const serverRecentSignInType = data.data.recentSignInType;
      console.log("serverRecentSignInType", serverRecentSignInType);
      const localRecentSignInType = localStorage.getItem("recent_sign_in_type");
      // ||
      // sessionStorage.getItem("recent_sign_in_type");
      console.log("localRecentSignInType", localRecentSignInType);
      if (
        serverRecentSignInType &&
        serverRecentSignInType !== localRecentSignInType
      ) {
        // Update to match server's value
        const keepSignIn = localStorage.getItem("keep_signin_yn");
        // if (keepSignIn === "Y") {
        localStorage.setItem("recent_sign_in_type", serverRecentSignInType);
        // } else {
        // sessionStorage.setItem("recent_sign_in_type", serverRecentSignInType);
        // }
      }
    } else {
      // 비로그인/유저 미존재 상태에서는 user를 보관하지 않습니다.
      setState({ user: null });
    }
  }, [data, setState]);
};

export default useInitializeAuth;
