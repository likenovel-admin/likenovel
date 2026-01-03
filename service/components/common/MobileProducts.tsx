import { IProduct } from "@/types";
import ProductCoverCard from "./ProductCoverCard";

interface Props {
  headerText: string;
  products: IProduct[];
}
const MobileProducts = ({ headerText, products }: Props) => {
  return (
    <div className="pl-16pxr">
      <span className="text-17pxr font-bold">{headerText}</span>
      <div className="flex gap-10pxr mt-10pxr scroll-hidden overflow-x-auto">
        {products.map((product) => (
          <ProductCoverCard key={product.productId} data={product} />
        ))}
      </div>
    </div>
  );
};
export default MobileProducts;
