"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthenticate";
import { useProfileStore } from "@/store/useProfileStore";
import { LogoutEventTarget } from "@/lib/auth";

const publicRoutes = ["/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, setIsAuthenticated } = useAuthStore();

  const { clearProfile } = useProfileStore();
  const reset = () => {
    setIsAuthenticated(false);
    clearProfile();
  };
  useEffect(() => {
    LogoutEventTarget.addEventListener("logout", reset);
    return () => {
      LogoutEventTarget.removeEventListener("logout", reset);
    };
  }, []);

  useEffect(() => {
    const isPublicRoute = publicRoutes.includes(pathname);
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
  }, [pathname, router, isAuthenticated]);

  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
