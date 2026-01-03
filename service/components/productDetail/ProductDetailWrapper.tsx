"use client";

import { ProductInterestStatus } from "@/types";
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ButtonBottom from "./ButtonBottom";

interface ProductDetailWrapperProps {
  children: ReactNode;
  productId?: number;
  isPaidProduct?: boolean;
  episodeTypePaidCount?: number;
  interestStatus: ProductInterestStatus;
  interestEndDate?: string;
  authorId: number;
  authorName?: string;
  productName?: string;
}

export default function ProductDetailWrapper({
  children,
  productId,
  isPaidProduct,
  episodeTypePaidCount,
  interestStatus,
  interestEndDate,
  authorId,
  authorName,
  productName,
}: ProductDetailWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {children}
      {mounted &&
        createPortal(
          <ButtonBottom
            productId={productId}
            isPaidProduct={isPaidProduct}
            episodeTypePaidCount={episodeTypePaidCount}
            interestStatus={interestStatus}
            interestEndDate={interestEndDate}
            authorId={authorId}
            authorName={authorName}
            productName={productName}
          />,
          document.body // Render at end of body, after everything
        )}
    </>
  );
}
