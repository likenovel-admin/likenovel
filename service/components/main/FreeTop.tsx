import { useAdultCoverImage } from "@/hooks/useAdultCoverImage";
import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
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

// 메인 "인기 무료 Top" 노출 상한(요구사항)
const MOBILE_MAX_ITEMS = 40;
const DESKTOP_MAX_ITEMS = 30;

// PC(md 이상)에서 한 화면(페이지)당 노출 개수
const DESKTOP_PAGE_COLS = 5;
const DESKTOP_PAGE_ROWS = 3;
const DESKTOP_PAGE_SIZE = DESKTOP_PAGE_COLS * DESKTOP_PAGE_ROWS; // 15

// 모바일(md 미만): 문피아 스타일에 맞게 "2열 x 4행"이 보이도록 구성(가로 스와이프)
const MOBILE_GRID_COLS_VISIBLE = 2;
const MOBILE_GRID_ROWS = 4;

const FreeTop = ({ data }: Props) => {
  const router = useRouter();
  const renderAdultCoverImage = useAdultCoverImage();
  const [currentPage, setCurrentPage] = useState(0);

  if (!data || !data.length) {
    return <ErrorArea />;
  }

  const mobileProducts = data.slice(0, MOBILE_MAX_ITEMS);
  const desktopProducts = data.slice(0, DESKTOP_MAX_ITEMS);

  const currentProducts = desktopProducts.slice(
    currentPage * DESKTOP_PAGE_SIZE,
    (currentPage + 1) * DESKTOP_PAGE_SIZE
  );

  const totalItems = desktopProducts.length;
  const lastPage = Math.ceil(totalItems / DESKTOP_PAGE_SIZE) - 1;

  const handleNextPage = () => {
    setCurrentPage(currentPage >= lastPage ? 0 : currentPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(currentPage <= 0 ? lastPage : currentPage - 1);
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
        timeSpeechBubbleMode="ranking"
        hasRankingGuide
        hasMoreButton
        moreButtonOnClick={() => {
          router.push("/product/top50/free-top");
        }}
      />
      {/* 모바일: 문피아 스타일(2열 x 4행) 가로 스와이프 구좌 */}
      <div className="md:hidden overflow-x-auto overflow-y-hidden scroll-hidden">
        <div className="pl-16pxr pr-16pxr">
          <div
            className="mt-10pxr grid w-max grid-flow-col auto-cols-[var(--freeTopColW)] grid-rows-4 gap-x-12pxr gap-y-10pxr"
            style={
              {
                // "한 화면에 2열이 정확히 보이도록" 컬럼 폭을 viewport 기준으로 고정합니다.
                // - 좌/우 패딩: 16px * 2 = 32px (바깥 wrapper가 담당)
                // - gap-x: 12px (컬럼 사이 간격)
                ["--freeTopColW" as any]: "calc((100vw - 32px - 12px) / 2)",
              } as CSSProperties
            }
          >
            {(mobileProducts as unknown as IProduct[]).map((product, index) => (
              <div
                key={`${product.productId}-${index}`}
                className="flex items-center gap-10pxr cursor-pointer min-w-0"
                onClick={() => {
                  setPendingProductDetailEntrySource(
                    product.productId,
                    PRODUCT_DETAIL_ENTRY_SOURCE.HOME_FREE_TOP
                  );
                  router.push(buildProductDetailPath(product.productId));
                }}
              >
                <div className="relative shrink-0">
                  {renderAdultCoverImage(
                    product,
                    56,
                    56,
                    "object-cover w-[56px] h-[56px] rounded-[10px]",
                    {
                      optimized: true,
                      sizes: "56px",
                    }
                  )}
                  <div className="absolute -top-4pxr -left-4pxr">
                    <span className="inline-flex items-center justify-center w-[20px] h-[20px] rounded-full bg-black/70 text-white text-11pxr font-semibold">
                      {product.rank?.currentRank || 0}
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-12pxr leading-16pxr text-dark-gray-500 font-semibold line-clamp-2">
                    {product.title}
                  </div>
                  <div className="mt-2pxr flex items-center justify-between min-w-0">
                    <span className="text-10pxr text-dark-gray-200 line-clamp-1">
                      {product.authorNickname || ""}
                    </span>
                    <InterestBadge
                      product={product as unknown as IProduct}
                      width={10}
                      height={14}
                      style=""
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PC/태블릿: 5x3 그리드(페이지네이션) */}
      <div className="hidden md:block">
        <div className="w-[1120px]">
          <div className="mt-20pxr grid grid-flow-col grid-cols-5 grid-rows-3 gap-[10px]">
            {(currentProducts as unknown as IProduct[]).map((product, index) => (
              <div
                key={`${product.productId}-${index}`}
                className="flex w-full min-w-0 h-[116px] rounded-[10px] cursor-pointer relative bg-white overflow-hidden"
                onClick={() => {
                  setPendingProductDetailEntrySource(
                    product.productId,
                    PRODUCT_DETAIL_ENTRY_SOURCE.HOME_FREE_TOP
                  );
                  router.push(buildProductDetailPath(product.productId));
                }}
              >
                <div className="relative shrink-0 w-[72px] h-[104px]">
                  {renderAdultCoverImage(
                    product,
                    72,
                    104,
                    "object-cover w-[72px] h-[104px] rounded-l-[10px]",
                    {
                      optimized: true,
                      sizes: "72px",
                    }
                  )}
                  {/* PC 랭킹 배지: 커버 좌상단에 딱 맞게 오버레이 */}
                  <div className="absolute top-0 left-0 scale-[0.8] origin-top-left">
                    <RankingBadge rank={product.rank?.currentRank || 0} />
                  </div>
                  {getIsNewEpisode(
                    product.properties?.latestEpisodeDate || ""
                  ) && (
                    <div className="absolute top-4pxr right-4pxr scale-[0.85] origin-top-right">
                      <SquareBadge type="up" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between flex-1 min-w-0 pt-10pxr pb-10pxr pl-10pxr pr-8pxr">
                  <div className="min-w-0">
                    <div className="relative text-13pxr font-semibold leading-[17px] line-clamp-2">
                      {product.title}
                    </div>
                    <div className="mt-3pxr min-w-0">
                      <UserNickname
                        userNickname={product.authorNickname || ""}
                        product={product as unknown as IProduct}
                        textStyle="text-12pxr text-dark-gray-300"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end min-w-0">
                    <InterestBadge
                      product={product as unknown as IProduct}
                      width={14}
                      height={18}
                      style=""
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute top-[50%] left-[-15px] z-5 hidden lg:block">
            <CircleArrow
              direction="left"
              onClick={handlePrevPage}
            />
          </div>
          <div className="absolute top-[50%] right-[-15px] z-5 hidden lg:block">
            <CircleArrow
              direction="right"
              onClick={handleNextPage}
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
