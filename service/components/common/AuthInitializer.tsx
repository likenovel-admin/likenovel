"use client";
import useInitializeAuth from "@/hooks/useInitializeAuth";

const AuthInitializer = () => {
  useInitializeAuth();
  return null;
};

export default AuthInitializer;