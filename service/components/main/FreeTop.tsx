import { useAdultCoverImage } from "@/hooks/useAdultCoverImage";
import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CircleArrow from "../common/CircleArrow";
import ErrorArea from "../common/ErrorArea";
import InterestBadge from "../common/InterestBadge";
import MainHeader from "../common/MainHeader";
import RankingBadge from "../common/RankingBadge";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";

interface Props {
  data: IProduct[] | null;
}

const PAGE_SIZE = 9;

const FreeTop = ({ data }: Props) => {
  const router = useRouter();
  const renderAdultCoverImage = useAdultCoverImage();
  const [currentPage, setCurrentPage] = useState(0);

  if (!data || !data.length) {
    return <ErrorArea />;
  }

  const currentProducts = data.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const totalItems = data.length;
  const lastPage = Math.ceil(totalItems / PAGE_SIZE) - 1;

  const handleNextPage = () => {
    if ((currentPage + 1) * PAGE_SIZE < data.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderPaginationDots = () => {
    return Array.from({ length: lastPage + 1 }, (_, index) => (
      <button
        key={index}
        onClick={() => setCurrentPage(index)}
        className={`w-[8px] h-[8px] mx-1 rounded-full ${
          currentPage === index ? "bg-black-100" : "bg-light-gray-400"
        }`}
      />
    ));
  };

  return (
    <div className="relative">
      <MainHeader
        headerText="인기 무료 Top"
        hasTimeSpeechBubble
        hasMoreButton
        moreButtonOnClick={() => {
          router.push("/product/top50/free-top");
        }}
      />
      <div className="overflow-x-auto overflow-y-hidden scroll-hidden">
        <div className="w-[880px] md:w-[1120px]">
          <div className="mt-10pxr md:mt-20pxr grid grid-cols-3 gap-[12px] pl-16pxr md:pl-0">
            {(currentProducts as unknown as IProduct[]).map(
              (product, index) => (
                <div
                  key={`${product.productId}-${index}`}
                  className={`flex w-full min-w-[240px] h-[109px] md:max-w-[352px] md:h-[160px] border border-white md:border-light-gray-400  md:shadow-sm rounded-[10px] cursor-pointer relative ${
                    index % 3 === 0
                      ? "order-1"
                      : index % 3 === 1
                      ? "order-2"
                      : "order-3"
                  }`}
                  onClick={() => {
                    router.push(`/product/${product.productId}`);
                  }}
                >
                  {renderAdultCoverImage(
                    product,
                    110,
                    158,
                    "object-cover w-[80px] md:w-[110px] h-[110px] md:h-[158px] rounded-lg md:rounded-l-lg md:rounded-r-none"
                  )}
                  <div className="absolute top-[-5px] left-[10px] hidden md:block">
                    <RankingBadge rank={product.rank?.currentRank || 0} />
                  </div>
                  <div className="md:hidden flex items-center px-[20px]">
                    <span className="text-17pxr font-semibold">
                      {product.rank?.currentRank}
                    </span>
                  </div>
                  <div className="flex flex-col justify-between w-[150px] md:w-[230px] pt-10pxr md:pt-18pxr pb-12pxr md:pl-19pxr">
                    <div className="w-full mr-[20px]">
                      <span className="relative w-[140px] md:w-[200px] text-14pxr md:text-17pxr font-medium md:font-semibold leading-[19px] md:leading-[22px] line-clamp-2">
                        {product.title}
                        {getIsNewEpisode(
                          product.properties?.latestEpisodeDate || ""
                        ) && (
                          <div className="absolute bottom-[2px] inline-block ml-[5px]">
                            <SquareBadge type="up" />
                          </div>
                        )}
                      </span>
                      <div className="flex items-center mt-10pxr">
                        {product.genre?.map((item, index) => (
                          <div className="flex items-center" key={index}>
                            <span className="text-12pxr md:text-14pxr text-primary-100">
                              {item}
                            </span>
                            {index === 0 &&
                              product.genre &&
                              product.genre[1] &&
                              product.genre[1] !== "" && (
                                <div className="w-3pxr h-3pxr bg-primary-100 rounded-full mx-2" />
                              )}
                          </div>
                        ))}
                        <InterestBadge
                          product={product as unknown as IProduct}
                          width={10}
                          height={14}
                          style="md:hidden ml-7pxr"
                        />
                      </div>

                      <div className="flex mt-2pxr md:hidden">
                        <UserNickname
                          userNickname={product.authorNickname || ""}
                          product={product as unknown as IProduct}
                          textStyle="text-12pxr text-dark-gray-400"
                          badgeStyle="w-[14px] h-[14px]"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="border border-b border-white md:border-light-gray-100 w-[210px]" />
                      <div className="hidden md:flex justify-between mt-9pxr items-center">
                        <UserNickname
                          userNickname={product.authorNickname || ""}
                          product={product as unknown as IProduct}
                          textStyle="text-13pxr text-dark-gray-400"
                        />
                        {/* TODO: 3시간 후 관심 식는 아이콘 표시 추가 */}
                        <InterestBadge
                          product={product as unknown as IProduct}
                          width={16}
                          height={21}
                          style="hidden md:block mr-10pxr"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
          <div className="absolute top-[50%] left-[-15px] z-5 hidden lg:block">
            <CircleArrow
              direction="left"
              onClick={handlePrevPage}
              isDisabled={currentPage === 0}
            />
          </div>
          <div className="absolute top-[50%] right-[0px] z-5 hidden lg:block">
            <CircleArrow
              direction="right"
              onClick={handleNextPage}
              isDisabled={currentPage === lastPage}
            />
          </div>
          <div className="hidden lg:flex justify-center mt-6">
            {renderPaginationDots()}
          </div>
        </div>
      </div>
    </div>
  );
};
export default FreeTop;
