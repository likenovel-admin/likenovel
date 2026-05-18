import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import useMediaDevice from "@/hooks/useMediaDevice";
import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import {
  buildProductDetailPath,
  ProductDetailEntrySource,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AdultAgeBadge from "./AdultAgeBadge";
import InterestBadge from "./InterestBadge";
import SquareBadge from "./SquareBadge";
import UserNickname from "./UserNickname";
interface Props {
  data: IProduct;
  hasInterestBadge?: boolean;
  entrySource?: ProductDetailEntrySource;
}
const ProductCoverCard = ({
  data,
  hasInterestBadge = false,
  entrySource,
}: Props) => {
  const router = useRouter();
  const device = useMediaDevice();
  const coverImagePath = resolveProductCoverImage(data.image?.coverImagePath);
  const isDefaultCoverImage = coverImagePath === DEFAULT_PRODUCT_IMAGE;
  const navigateToProductDetail = () => {
    if (entrySource) {
      setPendingProductDetailEntrySource(data.productId, entrySource);
    }
    router.push(buildProductDetailPath(data.productId));
  };

  return (
    <div
      className="flex flex-col gap-13pxr cursor-pointer"
      onClick={() => {
        if (device === "desktop") {
          navigateToProductDetail();
        }
      }}
    >
      <div
        className="w-[108px] md:w-[142px] h-[164px] md:h-[217px] rounded-[10px] overflow-hidden"
        onClick={() => {
          if (device !== "desktop") {
            navigateToProductDetail();
          }
        }}
      >
        <div className="relative">
          <Image
            src={coverImagePath}
            alt={data.title}
            width={142}
            height={217}
            sizes="(max-width: 767px) 108px, 142px"
            unoptimized={isDefaultCoverImage}
            className="block object-cover w-[108px] md:w-[142px] h-[164px] md:h-[217px] rounded-[10px]"
          />
          <AdultAgeBadge product={data} />
          <div className="absolute flex bottom-[5px] left-[5px] gap-[2px]">
            {data.priceType === "paid" && (
              <SquareBadge
                type={getPromotionBadgeType(
                  data.badge?.waitForFreeYn || data.badge?.waitingForFreeYn,
                  data.badge?.freeEpisodeTicketCount,
                  data.badge?.timepassFromTo,
                  data.badge?.sixNinePathYn
                )}
                freeEpisodeNumber={data.badge?.freeEpisodeTicketCount}
                timePassValue={data.badge?.timepassFromTo}
              />
            )}
            {getIsNewEpisode(data.properties?.latestEpisodeDate || "") && (
              <SquareBadge type="up" />
            )}
          </div>
        </div>
      </div>
      <div
        className="flex flex-col gap-10pxr"
        onClick={() => {
          if (device !== "desktop") {
            navigateToProductDetail();
          }
        }}
      >
        <span className="w-[108px] md:w-[137px] text-14pxr md:text-15pxr font-medium leading-[19px] line-clamp-1">
          {data.title}
        </span>
        <div className="relative flex items-center">
          <UserNickname
            userNickname={data.authorNickname || ""}
            product={data}
            textStyle="text-12pxr md:text-13pxr text-dark-gray-400 leading-[100%]"
          />
          <InterestBadge
            product={data as unknown as IProduct}
            width={10}
            height={14}
            style="absolute bottom-[3px] right-0"
          />
        </div>
      </div>
    </div>
  );
};
export default ProductCoverCard;
