import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import { IProduct } from "@/types";

export const getAdultCoverImageSrc = (
  product: IProduct,
  isOnAdult?: boolean,
) => {
  const coverImagePath = resolveProductCoverImage(product.image?.coverImagePath);

  return !isOnAdult && product.adultYn === "Y"
    ? DEFAULT_PRODUCT_IMAGE
    : coverImagePath;
};
