import { IProduct } from "@/types";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import {
  buildProductDetailPath,
  ProductDetailEntrySource,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import Image from "next/image";
import { useRouter } from "next/navigation";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";

interface Props {
  products: IProduct[];
  entrySource?: ProductDetailEntrySource;
}

const SameAuthorProducts = ({ products, entrySource }: Props) => {
  const router = useRouter();
  const navigateToProductDetail = (productId: number) => {
    if (entrySource) {
      setPendingProductDetailEntrySource(productId, entrySource);
    }
    router.push(buildProductDetailPath(productId));
  };
  return (
    <div className="flex flex-col w-full pl-50pxr">
      <span className="text-22pxr font-bold">작가의 다른 작품</span>
      <div className="w-[90%] border border-t-light-gray-500 border-r-0 border-l-0 border-b-0 my-18pxr" />
      <div className="flex flex-col gap-13pxr">
        {products.map((product: any) => (
          <div
            className="flex gap-16pxr cursor-pointer"
            key={product.productId}
            onClick={() => {
              navigateToProductDetail(product.productId);
            }}
          >
            <div className="relative">
              {product.image && product.image.coverImagePath ? (
                <Image
                  src={product.image?.coverImagePath ?? ""}
                  alt={product.title}
                  width={90}
                  height={120}
                  className={`object-cover min-w-[90px] h-[120px] rounded-[10px]`}
                />
              ) : (
                <Image
                  src="https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
                  alt={product.title}
                  width={90}
                  height={120}
                  className={`object-cover min-w-[90px] h-[120px] rounded-[10px]`}
                />
              )}
              {product.priceType === "paid" && (
                <div
                  className={`absolute flex bottom-[5px] left-[5px] gap-[2px]`}
                >
                  <SquareBadge
                    type={getPromotionBadgeType(
                      product.waitForFreeYn || product.waitingForFreeYn,
                      product.freeEpisodes,
                      product.timepassFromTo,
                      product.sixNinePathYn
                    )}
                    freeEpisodeNumber={product.freeEpisodes}
                    timePassValue={product.timepassFromTo}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <span className="max-w-[150px] max-h-[40px] font-semibold leading-[19px] line-clamp-2">
                {product.title}
              </span>
              <div className="flex mt-5pxr mb-12pxr">
                {product.genre?.map((item: any, index: number) => (
                  <div className="flex items-center" key={index}>
                    <span className="text-14pxr text-dark-gray-400">
                      {item}
                    </span>
                    {index === 0 &&
                      product.genre &&
                      product.genre[1] &&
                      product.genre[1] !== "" && (
                        <div className="w-3pxr h-3pxr bg-dark-gray-400 rounded-full mx-1" />
                      )}
                  </div>
                ))}
              </div>
              <UserNickname
                product={product as any}
                userNickname={product.authorNickname || ""}
                textStyle="text-14pxr text-dark-gray-400"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SameAuthorProducts;
