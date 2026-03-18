import { IProduct } from "@/types";
import { PRODUCT_DETAIL_ENTRY_SOURCE } from "@/utils/productPath";
import ProductListCard from "../common/ProductListCard";

interface ReviewProductProps {
  product?: IProduct;
}

const ReviewProduct = ({ product }: ReviewProductProps) => {
  if (!product) return null;

  // Don't show author-specific features (conversion buttons, CP indicators, contract info)
  // in review product section as the product is not owned by the reviewer
  return (
    <ProductListCard
      key={product.productId}
      data={product}
      hasPromotionBadge
      isReviewPage
      entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.REVIEW_PRODUCT}
    />
  );
};

export default ReviewProduct;
