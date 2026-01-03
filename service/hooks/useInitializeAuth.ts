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

    setState({
      isAuthenticated: !!accessToken,
      user: storedUser ? JSON.parse(storedUser) : null,
      accessToken,
      refreshToken,
    });
  }, [setState]);

  useEffect(() => {
    if (data?.data) {
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
    }
  }, [data, setState]);
};

export default useInitializeAuth;
