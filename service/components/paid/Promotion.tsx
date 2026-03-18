import { IProduct } from "@/types";
import { PRODUCT_DETAIL_ENTRY_SOURCE } from "@/utils/productPath";
import MainHeader from "../common/MainHeader";
import ProductCoverCard from "../common/ProductCoverCard";

interface Props {
  data: IProduct[] | [];
}
const Promotion = ({ data }: Props) => {
  return (
    <div>
      <MainHeader
        headerText="프로모션 작품이에요"
        hasMoreButton
        moreButtonOnClick={() => {}}
      />
      <div className="overflow-auto scroll-hidden">
        <div className="w-[800px] md:w-[1120px]">
          <div className="grid grid-cols-7 max-h-[490px] md:max-h-[600px] gap-10pxr md:gap-20pxr mt-10pxr md:mt-20pxr scroll-hidden overflow-x-auto overflow-y-hidden  md:overflow-hidden pl-16pxr md:pl-0">
            {data?.map((product) => (
              <ProductCoverCard
                key={product.productId}
                data={product as unknown as IProduct}
                hasInterestBadge
                entrySource={PRODUCT_DETAIL_ENTRY_SOURCE.PAID_PROMOTION}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Promotion;
