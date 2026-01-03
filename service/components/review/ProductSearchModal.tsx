import { useSelectSearchProductReview } from "@/app/api/query/search";
import useAuthStore from "@/store/authStore";
import { IProduct } from "@/types";
import { getIsNewEpisode } from "@/utils/getIsNewEpisode";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { debounce } from "es-toolkit";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ModalContainer from "../common/ModalContainer";
import Spinner from "../common/Spinner";
import SquareBadge from "../common/SquareBadge";
import UserNickname from "../common/UserNickname";
import Input from "../form/input";
import Search from "/public/images/search.svg";
interface ProductSearchModalProps extends CommonModalProps {
  onSelect: (product: IProduct) => void;
}
const ProductSearchModal = ({
  isOpen,
  onClose,
  onSelect,
}: ProductSearchModalProps) => {
  const { user } = useAuthStore();
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [limit, setLimit] = useState(18);
  const isLoadingMoreRef = useRef(false);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchKeyword(value);
      setLimit(18); // Reset limit when search keyword changes
      hasMoreRef.current = true; // Reset hasMore flag when search keyword changes
    }, 1000),
    []
  );

  const adultYn = user?.isOnAdult ? "Y" : "N";
  const { data, isLoading, isFetching } = useSelectSearchProductReview(
    searchKeyword,
    adultYn,
    undefined
  );

  const products = useMemo(() => {
    if (!data?.data || !searchKeyword) return [];
    return data.data;
  }, [data, searchKeyword]);

  const prevProductsLengthRef = useRef(0);

  // Check if we've reached the end of data
  useEffect(() => {
    if (!isFetching && products.length > 0) {
      // If products length hasn't changed after a fetch, we've reached the end
      if (products.length === prevProductsLengthRef.current) {
        hasMoreRef.current = false;
      } else {
        prevProductsLengthRef.current = products.length;
      }
    }
  }, [isFetching, products.length]);

  const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;

    const parts = text.split(new RegExp(`(${keyword})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <span key={index} className="text-primary-100">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    debouncedSearch(value);
  };

  // Use Intersection Observer to detect when user scrolls near bottom
  useEffect(() => {
    if (!isOpen || !loadMoreTriggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (
          entry.isIntersecting &&
          !isFetching &&
          !isLoadingMoreRef.current &&
          products.length > 0 &&
          hasMoreRef.current
        ) {
          isLoadingMoreRef.current = true;
          setLimit((prevLimit) => prevLimit + 12);
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0,
      }
    );

    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isOpen, isFetching, products.length, limit]);

  useEffect(() => {
    if (!isFetching) {
      isLoadingMoreRef.current = false;
    }
  }, [isFetching]);

  useEffect(() => {
    if (!isOpen) {
      setKeyword("");
      setSearchKeyword("");
      setLimit(18);
      hasMoreRef.current = true;
      prevProductsLengthRef.current = 0;
    }
  }, [isOpen]);

  return (
    <ModalContainer size="full" isOpen={isOpen} onClose={onClose}>
      <div className="md:w-[714px]">
        <div className="w-full py-4 px-6 border-b">
          <Input
            placeholder="작품명, 작가명, 태그입력"
            inputStyle="w-full px-4 h-10 rounded-full"
            additionalText={<Search className="w-4 h-4 mr-3" />}
            onChange={handleInputChange}
            value={keyword}
          />
        </div>
        <div className="flex flex-col p-4">
          <div className="text-17pxr font-semibold">
            <span className="text-primary-100">{keyword || "검색어"}</span>{" "}
            검색결과
          </div>
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Spinner />
            </div>
          )}
          {!isLoading && products.length === 0 && keyword && (
            <div className="flex justify-center items-center py-20 text-dark-gray-200">
              검색 결과가 없습니다.
            </div>
          )}
          {!isLoading && products.length > 0 && (
            <>
              <div className="grid grid-cols-3 md:grid-cols-6 mt-3 gap-y-5 gap-x-2">
                {products.map((item: IProduct) => (
                  <button
                    key={item.productId}
                    onClick={() => onSelect(item)}
                    className="flex justify-start items-start flex-col"
                  >
                    <div className="w-full h-auto rounded-[10px] relative aspect-[140/215] overflow-hidden">
                      <Image
                        src={
                          item.image?.coverImagePath || "/images/test/book.svg"
                        }
                        className="rounded-[10px]"
                        alt="product"
                        fill
                      />
                      <div className="z-10 absolute bottom-[3px] left-[3px] flex gap-0.5">
                        {item.badge && (
                          <>
                            <SquareBadge
                              // type={["waitForFree", "timePass", "freeEpisodes"]}
                              // freeEpisodeNumber={3}
                              // timePassValue={"6-1"}
                              type={getPromotionBadgeType(
                                item.badge?.waitForFreeYn ||
                                  item.badge?.waitingForFreeYn,
                                item.badge?.freeEpisodeTicketCount,
                                item.badge?.timepassFromTo,
                                item.badge?.sixNinePathYn
                              )}
                              freeEpisodeNumber={
                                item.badge?.freeEpisodeTicketCount
                              }
                              timePassValue={item.badge?.timepassFromTo}
                              size="small"
                            />
                            {getIsNewEpisode(
                              item.properties?.latestEpisodeDate || ""
                            ) && <SquareBadge type={"up"} size="small" />}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-12pxr md:text-16pxr mt-1 line-clamp-2 text-start">
                      {highlightText(item.title, keyword)}
                    </div>

                    <UserNickname
                      userNickname={item.authorNickname}
                      product={item}
                    />
                  </button>
                ))}
              </div>
              {/* Intersection Observer trigger element */}
              {/* <div ref={loadMoreTriggerRef} className="h-10 w-full" /> */}
              {isFetching && (
                <div className="flex justify-center items-center py-4">
                  <Spinner />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ModalContainer>
  );
};

export default ProductSearchModal;
