"use client";

import { ProductInterestStatus } from "@/types";
import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ButtonBottom from "./ButtonBottom";

interface ProductDetailWrapperProps {
  children: ReactNode;
  productId?: number;
  isPaidProduct?: boolean;
  isVolumeProduct?: boolean;
  episodeTypePaidCount?: number;
  ownPrice?: number;
  rentalPrice?: number;
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
  isVolumeProduct,
  episodeTypePaidCount,
  ownPrice,
  rentalPrice,
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
            isVolumeProduct={isVolumeProduct}
            episodeTypePaidCount={episodeTypePaidCount}
            ownPrice={ownPrice}
            rentalPrice={rentalPrice}
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
