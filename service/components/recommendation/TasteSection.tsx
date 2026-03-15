"use client";

import { IRecommendSection } from "@/app/api/query/recommendation/dto";
import { usePostAiSignalEvent } from "@/app/api/query/recommendation";
import useMediaDevice from "@/hooks/useMediaDevice";
import useAuthStore from "@/store/authStore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import CircleArrow from "../common/CircleArrow";
import MainHeader from "../common/MainHeader";

interface Props {
  section: IRecommendSection;
}

const TasteSection = ({ section }: Props) => {
  const router = useRouter();
  const device = useMediaDevice();
  const { isAuthenticated, accessToken } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
  }));
  const { mutate: postSignalEvent } = usePostAiSignalEvent();
  const [currentPage, setCurrentPage] = useState(0);
  const [brokenCoverProductIds, setBrokenCoverProductIds] = useState<
    Record<number, true>
  >({});
  const itemsPerPage = 6;
  const isDesktop = device !== "mobile" && device !== "tablet";
  const canTrackAiTasteClick = Boolean(isAuthenticated || accessToken);

  if (!section.products.length) return null;

  const title = section.title?.trim() ? section.title : "AI 추천 작품";
  const parts = title.split(/'([^']+)'/g);
  const slotTitle =
    parts.length <= 1
      ? title
      : parts.map((part, index) =>
          index % 2 === 1 ? (
            <span key={`slot-title-highlight-${index}`} className="text-primary-100">
              {part}
            </span>
          ) : (
            <Fragment key={`slot-title-text-${index}`}>{part}</Fragment>
          )
        );
  const currentProducts = section.products.slice(
    currentPage,
    currentPage + itemsPerPage
  );
  const lastPage = Math.max(0, section.products.length - itemsPerPage);
  const showArrows = isDesktop && section.products.length > itemsPerPage;

  return (
    <div className="relative max-w-[1120px] md:h-[350px]">
      <MainHeader headerText={slotTitle} />

      <div className="flex gap-10pxr md:gap-20pxr mt-10pxr md:mt-20pxr scroll-hidden overflow-x-auto lg:overflow-hidden pl-16pxr md:pl-0">
        {currentProducts.map((product) => {
          const isCoverBroken = Boolean(
            brokenCoverProductIds[product.productId]
          );
          return (
            <div
              key={product.productId}
              className="flex-shrink-0 w-[108px] md:w-[142px] cursor-pointer"
              onClick={() => {
                if (canTrackAiTasteClick) {
                  postSignalEvent({
                    product_id: product.productId,
                    event_type: "taste_slot_click",
                    event_payload: {
                      source: "ai_taste_section",
                      slot_title: section.title,
                      slot_dimension: section.dimension,
                    },
                  });
                }
                router.push(`/product/${product.productId}`);
              }}
            >
              <div className="relative w-[108px] md:w-[142px] h-[164px] md:h-[217px] bg-light-gray-100 rounded-[10px] overflow-hidden">
                {product.coverUrl && !isCoverBroken ? (
                  <Image
                    src={product.coverUrl}
                    alt={product.title}
                    width={142}
                    height={217}
                    unoptimized
                    className="object-cover w-full h-full rounded-[10px]"
                    onError={() =>
                      setBrokenCoverProductIds((prev) => ({
                        ...prev,
                        [product.productId]: true,
                      }))
                    }
                  />
                ) : (
                  <Image
                    src="/images/default_cover.png"
                    alt={product.title}
                    width={142}
                    height={217}
                    className="object-cover w-full h-full rounded-[10px]"
                  />
                )}
              </div>
              <div className="mt-8pxr">
                <p className="text-14pxr md:text-15pxr font-medium line-clamp-1">
                  {product.title}
                </p>
                {product.authorNickname && (
                  <p className="text-12pxr text-dark-gray-400 mt-2pxr">
                    {product.authorNickname}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showArrows && (
        <>
          <div className="absolute top-[43%] left-[-20px] z-5 hidden lg:block">
            <CircleArrow
              direction="left"
              onClick={() =>
                setCurrentPage(Math.max(0, currentPage - 1))
              }
              isDisabled={currentPage === 0}
            />
          </div>
          <div className="absolute top-[43%] right-[-20px] z-5 hidden lg:block">
            <CircleArrow
              direction="right"
              onClick={() =>
                setCurrentPage(Math.min(lastPage, currentPage + 1))
              }
              isDisabled={currentPage >= lastPage}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TasteSection;
