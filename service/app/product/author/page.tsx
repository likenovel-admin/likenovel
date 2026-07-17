"use client";

import ProductArea from "@/components/authorHome/ProductArea";
import TabLayout from "@/components/authorHome/TabLayout";
import Modal from "@/components/common/Modal";
import useAuthStore from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthorHome() {
  const router = useRouter();
  const { isAuthInitialized, isAuthenticated } = useAuthStore((state) => ({
    isAuthInitialized: state.isAuthInitialized,
    isAuthenticated: state.isAuthenticated,
  }));

  useEffect(() => {
    if (!isAuthInitialized || isAuthenticated) return;
    router.replace("/login?redirect=%2Fproduct%2Fauthor", { scroll: false });
  }, [isAuthInitialized, isAuthenticated, router]);

  if (!isAuthInitialized || !isAuthenticated) return null;

  return (
    <TabLayout activeTab={"myProduct"}>
      <ProductArea />
      <Modal size="fit" hasCloseButton={false} />
    </TabLayout>
  );
}
