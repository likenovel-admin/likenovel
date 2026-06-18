import InterestBadge from "@/components/common/InterestBadge";
import UserNickname from "@/components/common/UserNickname";
import { DEFAULT_PRODUCT_IMAGE } from "@/constants/common";
import { IProduct } from "@/types";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { shouldShowProductUpBadge } from "@/utils/productBadge";
import {
  ProductDetailEntrySource,
  setPendingProductDetailEntrySource,
  buildProductDetailPath,
} from "@/utils/productPath";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ErrorArea from "../common/ErrorArea";
import MainHeader from "../common/MainHeader";
import SquareBadge from "../common/SquareBadge";
interface Props {
  data: IProduct[] | null;
  title?: string;
  entrySource?: ProductDetailEntrySource;
}

const CPPromotion = ({
  data,
  title = "출판사 프로모션",
  entrySource,
}: Props) => {
  const router = useRouter();

  if (!data || !data.length) {
    return <ErrorArea />;
  }

  const navigateToProductDetail = (productId: number) => {
    if (entrySource) {
      setPendingProductDetailEntrySource(productId, entrySource);
    }
    router.push(buildProductDetailPath(productId));
  };

  return (
    <div className="mb-[10px]">
      {/* TODO: 더보기 클릭 시 페이지 이동 추가 */}
      <MainHeader
        headerText={title}
        hasMoreButton
        moreButtonOnClick={() => {
          router.push("/product/promotion");
        }}
      />
      <div className="overflow-auto scroll-hidden">
        <div className="w-[800px] md:w-[1120px]">
          <div className="mt-10pxr md:mt-20pxr flex md:grid md:grid-cols-6 gap-[10px] md:gap-[18px] pl-16pxr md:pl-0">
            {data.map((product) => (
              <div
                key={product.productId}
                className="cursor-pointer"
                onClick={() => {
                  navigateToProductDetail(product.productId);
                }}
              >
                <div className="relative flex flex-shrink-0">
                  <Image
                    src={
                      product?.image?.coverImagePath ?? DEFAULT_PRODUCT_IMAGE
                    }
                    alt={product.title}
                    width={172}
                    height={255}
                    className="object-cover w-[108px] md:w-[172px] h-[164px] md:h-[255px] rounded-[10px]"
                  />
                  <div className="absolute flex gap-[2px] bottom-[5px] left-[5px]">
                    {product.badge?.waitForFreeYn === "Y" && (
                      <SquareBadge
                        type={getPromotionBadgeType(
                          product.badge.waitForFreeYn ||
                            product.badge.waitingForFreeYn,
                          product.badge.freeEpisodeTicketCount,
                          product.badge.timepassFromTo,
                          product.badge.sixNinePathYn
                        )}
                        freeEpisodeNumber={product.badge.freeEpisodeTicketCount}
                        timePassValue={product.badge.timepassFromTo}
                      />
                    )}
                    {shouldShowProductUpBadge(product) && (
                      <SquareBadge type="up" />
                    )}
                  </div>
                </div>
                <div className="relative max-w-[137px] mt-13pxr">
                  <span className="text-15pxr md:text-16pxr font-medium line-clamp-2">
                    {product.title}
                  </span>
                  <UserNickname
                    product={product as unknown as IProduct}
                    userNickname={product.authorNickname || ""}
                    textStyle="text-dark-gray-400 text-13pxr"
                    badgeStyle="w-[14px] h-[14px]"
                  />
                  <InterestBadge
                    product={product as unknown as IProduct}
                    width={10}
                    height={14}
                    style="absolute bottom-[5px] right-0 md:right-[-10px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CPPromotion;
