"use client";

import { usePartnerRelayConsume } from "@/api/auth";
import FullPageLoader from "@/components/common/FullPageLoader";
import { useAuthStore } from "@/store/useAuthenticate";
import { useProfileStore } from "@/store/useProfileStore";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PartnerRelayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [started, setStarted] = useState(false);
  const { setIsAuthenticated } = useAuthStore();
  const { setProfile, clearProfile } = useProfileStore();
  const relayConsume = usePartnerRelayConsume();

  useEffect(() => {
    if (started) {
      return;
    }
    setStarted(true);

    const relayKey = searchParams.get("relay_key");
    if (!relayKey) {
      router.replace("/login");
      return;
    }

    relayConsume.mutate(
      { relay_key: relayKey },
      {
        onSuccess: (res) => {
          const auth = res?.data?.auth;
          if (!auth?.accessToken || !auth?.refreshToken || !auth?.userId) {
            setIsAuthenticated(false);
            clearProfile();
            router.replace("/login");
            return;
          }

          localStorage.setItem("token", auth.accessToken);
          localStorage.setItem("refreshToken", auth.refreshToken);
          setProfile({ id: auth.userId });
          setIsAuthenticated(true);
          router.replace("/products");
        },
        onError: () => {
          setIsAuthenticated(false);
          clearProfile();
          router.replace("/login");
        },
      }
    );
  }, [
    started,
    searchParams,
    router,
    relayConsume,
    setIsAuthenticated,
    setProfile,
    clearProfile,
  ]);

  return <FullPageLoader isLoading />;
}
