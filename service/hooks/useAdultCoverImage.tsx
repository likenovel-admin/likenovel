import { DEFAULT_PRODUCT_IMAGE } from "@/constants/common";
import { IProduct } from "@/types";
import { getAdultCoverImageSrc } from "@/utils/adultCoverImage";
import { getUser } from "@/utils/getUser";
import Image from "next/image";
import { useState } from "react";

interface AdultCoverImageRenderOptions {
  optimized?: boolean;
  sizes?: string;
}

interface AdultCoverImageProps {
  product: IProduct;
  src: string;
  width: number;
  height: number;
  className?: string;
  options: AdultCoverImageRenderOptions;
}

const AdultCoverImage = ({
  product,
  src,
  width,
  height,
  className,
  options,
}: AdultCoverImageProps) => {
  const [hasError, setHasError] = useState(false);
  const imageSrc = hasError ? DEFAULT_PRODUCT_IMAGE : src;
  const shouldOptimize =
    options.optimized && imageSrc !== DEFAULT_PRODUCT_IMAGE;

  if (shouldOptimize) {
    return (
      <Image
        src={imageSrc}
        alt={product.title}
        width={width}
        height={height}
        className={className}
        sizes={options.sizes}
        onError={() => {
          setHasError(true);
        }}
      />
    );
  }

  return (
    <img
      src={imageSrc}
      alt={product.title}
      width={width}
      height={height}
      className={className}
      onError={() => {
        if (imageSrc !== DEFAULT_PRODUCT_IMAGE) {
          setHasError(true);
        }
      }}
    />
  );
};

export const useAdultCoverImage = () => {
  const user = getUser();
  const getAdultCoverImage = (
    product: IProduct,
    width: number,
    height: number,
    className?: string,
    options: AdultCoverImageRenderOptions = {},
  ) => {
    const coverImagePath = getAdultCoverImageSrc(product, user?.isOnAdult);

    return (
      <AdultCoverImage
        product={product}
        src={coverImagePath}
        width={width}
        height={height}
        className={className}
        options={options}
      />
    );
  };

  return getAdultCoverImage;
};
