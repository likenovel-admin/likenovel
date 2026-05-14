"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthenticate";
import { useProfileStore } from "@/store/useProfileStore";
import { LogoutEventTarget } from "@/lib/auth";

const publicRoutes = ["/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, setIsAuthenticated } = useAuthStore();
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  const { clearProfile } = useProfileStore();
  const reset = useCallback(() => {
    setIsAuthenticated(false);
    clearProfile();
  }, [clearProfile, setIsAuthenticated]);

  const hasStoredSession = useCallback(() => {
    return (
      typeof window !== "undefined" &&
      !!localStorage.getItem("token") &&
      !!localStorage.getItem("refreshToken")
    );
  }, []);

  useEffect(() => {
    LogoutEventTarget.addEventListener("logout", reset);
    return () => {
      LogoutEventTarget.removeEventListener("logout", reset);
    };
  }, [reset]);

  useEffect(() => {
    const hasSession = hasStoredSession();

    if (hasSession && !isAuthenticated) {
      setIsAuthenticated(true);
    } else if (!hasSession && isAuthenticated) {
      reset();
    }

    setIsSessionChecked(true);
  }, [hasStoredSession, isAuthenticated, reset, setIsAuthenticated]);

  useEffect(() => {
    const isPublicRoute = publicRoutes.includes(pathname);
    const hasSession = hasStoredSession();

    if (!isSessionChecked) {
      return;
    }

    if (isAuthenticated && !hasSession) {
      reset();
      if (!isPublicRoute) {
        router.replace("/login");
      }
      return;
    }

    if (isAuthenticated && pathname === "/login") {
      router.replace("/statistics/site");
      return;
    }

    if (pathname === "/") {
      if (isAuthenticated) {
        router.replace("/statistics/site");
      } else {
        router.replace("/login");
      }
      return;
    }

    if (!isPublicRoute && !isAuthenticated) {
      router.replace("/login");
      return;
    }
  }, [pathname, router, isAuthenticated, isSessionChecked, hasStoredSession, reset]);

  if (!isSessionChecked && !publicRoutes.includes(pathname)) {
    return null;
  }

  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
