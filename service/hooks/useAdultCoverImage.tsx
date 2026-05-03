import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import { IProduct } from "@/types";
import { getUser } from "@/utils/getUser";

export const useAdultCoverImage = () => {
  const user = getUser();
  const getAdultCoverImage = (
    product: IProduct,
    width: number,
    height: number,
    className?: string
  ) => {
    const coverImagePath = resolveProductCoverImage(product.image?.coverImagePath);

    return !user?.isOnAdult && product.adultYn === "Y" ? (
      <img
        src={DEFAULT_PRODUCT_IMAGE}
        alt={product.title}
        width={width}
        height={height}
        className={className}
      />
    ) : (
      <img
        src={coverImagePath}
        alt={product.title}
        width={width}
        height={height}
        className={className}
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
        }}
      />
    );
  };

  return getAdultCoverImage;
};
