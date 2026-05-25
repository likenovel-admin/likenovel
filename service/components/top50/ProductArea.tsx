import { useGetAiProductBriefs } from "@/app/api/query/recommendation";
import { IProduct } from "@/types";
import { getLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
import { PRODUCT_DETAIL_ENTRY_SOURCE } from "@/utils/productPath";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BoxProductList from "../common/BoxProductList";
import ListTypeTab from "../common/ListTypeTab";
import MainHeader from "../common/MainHeader";
import ProductListCard from "../common/ProductListCard";
import Spinner from "../common/Spinner";

interface Props {
  data: IProduct[] | null;
  pageType: "free" | "paid";
}
const ProductArea = ({ data, pageType = "free" }: Props) => {
  const allProducts = useMemo(() => data ?? [], [data]);
  const ITEMS_PER_LOAD = 20;
  const observerTarget = useRef<HTMLDivElement>(null);

  const [listType, setListType] = useState<"list" | "box">(() => {
    return (getLocalStorage<"list" | "box">(STORAGE_KEYS.PAID_TOP_VIEW_TYPE) ||
      "list") as "list" | "box";
  });
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [allProducts]);

  const hasMore = visibleCount < allProducts.length;
  const visibleProducts = useMemo(
    () => allProducts.slice(0, visibleCount),
    [allProducts, visibleCount]
  );
  const aiBriefProductIds = useMemo(
    () =>
      listType === "list"
        ? visibleProducts.map((product) => product.productId)
        : [],
    [visibleProducts, listType]
  );
  const { data: aiBriefsData } = useGetAiProductBriefs(
    aiBriefProductIds,
    "N",
    listType === "list" && aiBriefProductIds.length > 0
  );
  const aiBriefsByProductId = useMemo(
    () =>
      new Map(
        (aiBriefsData?.data ?? []).map((brief) => [brief.productId, brief])
      ),
    [aiBriefsData]
  );

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (!target?.isIntersecting || !hasMore) return;

      setVisibleCount((prev) =>
        Math.min(prev + ITEMS_PER_LOAD, allProducts.length)
      );
    },
    [hasMore, allProducts.length]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element || !hasMore) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    observer.observe(element);

    return () => observer.unobserve(element);
  }, [handleObserver, hasMore]);

  return (
    <div className="flex flex-col mt-30pxr md:gap-20pxr">
      <div className="flex justify-between">
        <MainHeader headerText="인기 TOP 50" hasTimeSpeechBubble hasGuide />
        <ListTypeTab listType={listType} setListType={setListType} />
      </div>
      <div className="md:hidden w-[93%] ml-[16px] mt-10pxr border border-t-light-gray-400 border-b-0 border-l-0 border-r-0" />
      {listType === "list" ? (
        <div className="flex flex-col md:gap-14pxr">
          {visibleProducts.map((product) => (
            <ProductListCard
              key={product.productId}
              data={product}
              hasRank
              hasGle={false}
              hasInterestBadge
              hasPromotionBadge={pageType === "paid" ? true : false}
              isAdultFilterEnabled
              hideStats
              enableAiLibrarianPreview
              aiLibrarianBrief={
                aiBriefsByProductId.get(product.productId) ?? null
              }
              entrySource={
                pageType === "paid"
                  ? PRODUCT_DETAIL_ENTRY_SOURCE.TOP50_PAID
                  : PRODUCT_DETAIL_ENTRY_SOURCE.TOP50_FREE
              }
            />
          ))}
          {hasMore && (
            <>
              <div ref={observerTarget} className="h-4" />
              <div className="py-4 flex justify-center items-center">
                <Spinner size={20} />
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <BoxProductList
            data={visibleProducts}
            pageType={pageType}
            hasLank
            entrySource={
              pageType === "paid"
                ? PRODUCT_DETAIL_ENTRY_SOURCE.TOP50_PAID
                : PRODUCT_DETAIL_ENTRY_SOURCE.TOP50_FREE
            }
          />
          {hasMore && (
            <>
              <div ref={observerTarget} className="h-4" />
              <div className="py-4 flex justify-center items-center">
                <Spinner size={20} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
export default ProductArea;
