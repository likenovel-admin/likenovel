import { IProduct } from "@/types";
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
    />
  );
};

export default ReviewProduct;
