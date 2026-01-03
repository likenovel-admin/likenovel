"use client";
import { useStorageRelay } from "@/app/api/query/storage-relay";
import useAuthStore from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const StorageRelayPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuthStore((state) => ({ signIn: state.signIn }));
  const { mutateAsync: storageRelayMutate } = useStorageRelay();

  const snsId = searchParams.get("sns_id");
  const tempIssuedKey = searchParams.get("temp_issued_key");
  const keepSignIn = searchParams.get("keep_signin_yn");

  useEffect(() => {
    if (snsId && tempIssuedKey) {
      try {
        const fetchData = async () => {
          const res = await storageRelayMutate({
            sns_id: Number(snsId),
            temp_issued_key: tempIssuedKey || "",
          });

          if (res.data.data) {
            signIn(
              {
                accessToken: res.data.data.auth.accessToken,
                refreshToken: res.data.data.auth.refreshToken,
                expiresIn: res.data.data.auth.accessTokenExpiresIn,
                refreshExpiresIn: res.data.data.auth.refreshTokenExpiresIn,
              },
              res.data.data.auth.recentSignInType,
              {
                userId: res.data.data.auth.userId,
                birthDate: res.data.data.auth.birthDate,
                gender: res.data.data.auth.gender,
              },
              keepSignIn || "Y" // Default to "Y" if not provided
            );
          }
          // 저장된 세션 정보를 가져와서 세션 스토리지 및 로컬 스토리지에 세팅한 후, 메인페이지로 이동
          router.push("/");
        };

        fetchData();
      } catch (error) {
        // error
      }
    }
  }, []);

  return <></>;
};

export default StorageRelayPage;
