"use client";

import ProductArea from "@/components/authorHome/ProductArea";
import TabLayout from "@/components/authorHome/TabLayout";
import Modal from "@/components/common/Modal";

export default function AuthorHome() {
  return (
    <TabLayout activeTab={"myProduct"}>
      <ProductArea />
      <Modal size="fit" hasCloseButton={false} />
    </TabLayout>
  );
}
