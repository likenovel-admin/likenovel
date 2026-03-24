"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthenticate";
import { LogoutEventTarget } from "@/lib/auth";
import { useProfileStore } from "@/store/useProfileStore";

const publicRoutes = ["/login", "/register", "/auth/relay"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setIsAuthenticated, isAuthenticated } = useAuthStore();
  const { clearProfile, setProfile } = useProfileStore();
  const reset = () => {
    setIsAuthenticated(false);
    clearProfile();
  };

  useEffect(() => {
    const receiveMessage = (
      event: MessageEvent<{
        sharedState?: {
          accessToken?: string;
          refreshToken?: string;
          id?: number;
        };
      }>
    ) => {
      console.log("event", event);
      if (event.origin !== process.env.NEXT_PUBLIC_CMS_SITE_URL) return;

      console.log("Received data:", event.data?.sharedState);
      const data = event.data?.sharedState;
      if (!data) {
        return;
      }
      if (data.accessToken) {
        localStorage.setItem("token", data.accessToken);
      }
      if (data?.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      if (data?.id) {
        setProfile({
          id: data.id,
        });
      }
    };

    window.addEventListener("message", receiveMessage);
    return () => window.removeEventListener("message", receiveMessage);
  }, []);

  useEffect(() => {
    LogoutEventTarget.addEventListener("logout", reset);
    return () => {
      LogoutEventTarget.removeEventListener("logout", reset);
    };
  }, []);

  useEffect(() => {
    const isPublicRoute = publicRoutes.includes(pathname);
    const hasStoredSession =
      typeof window !== "undefined" &&
      !!localStorage.getItem("token") &&
      !!localStorage.getItem("refreshToken");

    if (isAuthenticated && !hasStoredSession) {
      reset();
      if (!isPublicRoute) {
        router.replace("/login");
      }
      return;
    }

    if (isAuthenticated && pathname === "/login") {
      router.replace("/products");
      return;
    }

    if (pathname === "/") {
      if (isAuthenticated) {
        router.replace("/products");
      } else {
        router.replace("/login");
      }
      return;
    }

    if (!isPublicRoute && !isAuthenticated) {
      router.replace("/login");
      return;
    }
  }, [pathname, router, isAuthenticated]);

  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
