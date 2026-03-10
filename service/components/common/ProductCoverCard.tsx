import useMediaDevice from "@/hooks/useMediaDevice";
import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import getNumberToString from "@/utils/getNumberToString";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import InterestBadge from "./InterestBadge";
import SquareBadge from "./SquareBadge";
import UserNickname from "./UserNickname";
import Bookmark from "/public/images/bookmark.svg";
import ThumbsUp from "/public/images/thumbs-up-gray.svg";
import View from "/public/images/view.svg";
interface Props {
  data: IProduct;
  hasInterestBadge?: boolean;
}
const ProductCoverCard = ({ data, hasInterestBadge = false }: Props) => {
  const router = useRouter();
  const device = useMediaDevice();
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className="flex flex-col gap-13pxr cursor-pointer"
      onClick={() => {
        if (device === "desktop") {
          router.push(`/product/${data.productId}`);
        }
      }}
    >
      <div
        className="w-[108px] md:w-[142px] h-[164px] md:h-[217px] bg-black-100 rounded-[10px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          {data.image && data.image.coverImagePath ? (
            <Image
              src={data.image?.coverImagePath ?? ""}
              alt={data.title}
              width={142}
              height={217}
              className={`object-cover w-[108px] md:w-[142px] h-[164px] md:h-[217px] rounded-[10px] transition duration-300 ease-in-out ${
                isHovered ? "opacity-0" : "opacity-100"
              }`}
            />
          ) : (
            <Image
              src="https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
              alt={data.title}
              width={142}
              height={217}
              className={`object-cover w-[108px] md:w-[142px] h-[164px] md:h-[217px] rounded-[10px] transition duration-300 ease-in-out ${
                isHovered ? "opacity-0" : "opacity-100"
              }`}
            />
          )}
          {isHovered ? (
            <>
              <div
                className={`absolute w-[87px] md:w-[110px] top-[13px] left-[12px] leading-[15px] md:leading-[20px]`}
              >
                {(data?.keywords || [])?.map(
                  (keyword, index) =>
                    keyword && (
                      <span
                        key={index}
                        className="text-white text-11pxr md:text-13pxr mr-1"
                      >
                        #{keyword}
                      </span>
                    )
                )}
              </div>
              <div className="absolute bottom-[37px] left-[12px] w-[90px] md:w-[118px] border border-b-dark-gray-600 border-t-0 border-l-0 border-r-0" />
              <div className="absolute flex justify-between w-full bottom-[12px] px-[8px] md:px-[14px]">
                <div className="flex items-center gap-3pxr">
                  <View className="w-[10px] md:w-[14px] h-[13px] text-[#8D9198]" />
                  <span className="text-light-gray-600 text-10pxr md:text-12pxr">
                    {getNumberToString(data.trendindex?.hitCount || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-3pxr">
                  <ThumbsUp className="w-[12px] md:w-[15px] h-[12px]" />
                  <span className="text-light-gray-600 text-10pxr md:text-12pxr">
                    {getNumberToString(data.trendindex?.recommendCount || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-3pxr">
                  <Bookmark className="w-[8px] md:w-[10px] h-[13px] text-[#8D9198]" />
                  <span className="text-light-gray-600 text-10pxr md:text-12pxr">
                    {getNumberToString(data.trendindex?.bookmarkCount || 0)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className={`absolute flex bottom-[5px] left-[5px] gap-[2px]`}>
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
          )}
        </div>
      </div>
      <div
        className="flex flex-col gap-10pxr"
        onClick={() => {
          if (device !== "desktop") {
            router.push(`/product/${data.productId}`);
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
