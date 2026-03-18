import { IProduct } from "@/types";
import { ProductDetailEntrySource } from "@/utils/productPath";
import ProductCoverCard from "./ProductCoverCard";

interface Props {
  headerText: string;
  products: IProduct[];
  entrySource?: ProductDetailEntrySource;
}
const MobileProducts = ({ headerText, products, entrySource }: Props) => {
  return (
    <div className="pl-16pxr">
      <span className="text-17pxr font-bold">{headerText}</span>
      <div className="flex gap-10pxr mt-10pxr scroll-hidden overflow-x-auto">
        {products.map((product) => (
          <ProductCoverCard
            key={product.productId}
            data={product}
            entrySource={entrySource}
          />
        ))}
      </div>
    </div>
  );
};
export default MobileProducts;
