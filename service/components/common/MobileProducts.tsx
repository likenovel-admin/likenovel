import { IProduct } from "@/types";
import { ProductDetailEntrySource } from "@/utils/productPath";
import ProductCoverCard from "./ProductCoverCard";

interface Props {
  headerText: string;
  products: IProduct[];
  entrySource?: ProductDetailEntrySource;
  emptyMessage?: string;
}
const MobileProducts = ({
  headerText,
  products,
  entrySource,
  emptyMessage,
}: Props) => {
  return (
    <div className="pl-16pxr">
      <span className="text-17pxr font-bold">{headerText}</span>
      {products.length > 0 ? (
        <div className="flex gap-10pxr mt-10pxr scroll-hidden overflow-x-auto">
          {products.map((product) => (
            <ProductCoverCard
              key={product.productId}
              data={product}
              entrySource={entrySource}
            />
          ))}
        </div>
      ) : emptyMessage ? (
        <p className="mt-10pxr pr-16pxr text-14pxr leading-[1.5] text-dark-gray-300">
          {emptyMessage}
        </p>
      ) : null}
    </div>
  );
};
export default MobileProducts;
