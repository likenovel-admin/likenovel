"use client";
import { useStorageRelay } from "@/app/api/query/storage-relay";
import {
  ONBOARDING_FIRST_LOGIN_SESSION_KEY,
  SOCIAL_SIGNUP_PENDING_SESSION_KEY,
} from "@/constants/onboarding";
import useAuthStore from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

const StorageRelayPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuthStore((state) => ({ signIn: state.signIn }));
  const { mutateAsync: storageRelayMutate } = useStorageRelay();

  const snsId = searchParams.get("sns_id");
  const tempIssuedKey = searchParams.get("temp_issued_key");
  const keepSignIn = searchParams.get("keep_signin_yn");
  const resolvedKeepSignIn = keepSignIn === "N" ? "N" : "Y";
  const redirectToLogin = useCallback(() => {
    router.replace(
      `/login?error=${encodeURIComponent(
        "로그인 정보가 만료되었습니다. 다시 로그인해주세요."
      )}`
    );
  }, [router]);

  useEffect(() => {
    if (snsId && tempIssuedKey) {
      const fetchData = async () => {
        try {
          const res = await storageRelayMutate({
            sns_id: Number(snsId),
            temp_issued_key: tempIssuedKey || "",
          });
          const auth = res.data.data?.auth;

          if (!auth?.accessToken || !auth?.refreshToken) {
            redirectToLogin();
            return;
          }

          signIn(
            {
              accessToken: auth.accessToken,
              refreshToken: auth.refreshToken,
              expiresIn: auth.accessTokenExpiresIn,
              refreshExpiresIn: auth.refreshTokenExpiresIn,
            },
            auth.recentSignInType,
            {
              userId: auth.userId,
              birthDate: auth.birthDate,
              gender: auth.gender,
            },
            resolvedKeepSignIn
          );
          if (typeof window !== "undefined") {
            const isSocialSignup =
              sessionStorage.getItem(SOCIAL_SIGNUP_PENDING_SESSION_KEY) ===
              "Y";
            if (isSocialSignup) {
              sessionStorage.setItem(ONBOARDING_FIRST_LOGIN_SESSION_KEY, "Y");
              sessionStorage.removeItem(SOCIAL_SIGNUP_PENDING_SESSION_KEY);
            }
          }
          // 저장된 세션 정보를 가져와서 세션 스토리지 및 로컬 스토리지에 세팅한 후, 메인페이지로 이동
          router.push("/");
        } catch {
          redirectToLogin();
        }
      };

      fetchData();
    } else {
      redirectToLogin();
    }
  }, [
    redirectToLogin,
    resolvedKeepSignIn,
    router,
    signIn,
    snsId,
    storageRelayMutate,
    tempIssuedKey,
  ]);

  return <></>;
};

export default StorageRelayPage;
