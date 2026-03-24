// import { useSelectSuggestProducts } from "@/app/api/query/suggest";
import {
  useGetRecentProduct,
  useGetSuggestByRecentViewed,
} from "@/app/api/query/product";
import { IProduct } from "@/types";
import { getUser } from "@/utils/getUser";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Tab from "../common/Tab";
import UserNickname from "../common/UserNickname";
import ArrowRightSmall from "/public/images/arrow-right-small.svg";

const RecentlyView = () => {
  const router = useRouter();
  const user = getUser();
  const isAuthenticated = !!user?.userRole;
  const adultYn = user?.isOnAdult ? "Y" : "N";
  const [activeTab, setActiveTab] = useState(
    isAuthenticated ? "recentlyView" : "suggest"
  );

  // Auto switch to suggest tab if not authenticated
  useEffect(() => {
    if (!isAuthenticated && activeTab === "recentlyView") {
      setActiveTab("suggest");
    }
  }, [isAuthenticated, activeTab]);

  // const recentlyViewedProducts: IProduct[] = JSON.parse(
  //   localStorage.getItem("recent_viewed_products") || "[]"
  // );
  // const { data: suggestProducts } = useSelectSuggestProducts(
  //   recentlyViewedProducts[0]?.productId || 0,
  //   "genre"
  // );

  const { data: recentlyViewedProducts } = useGetRecentProduct(
    undefined,
    adultYn,
    !!user?.userId
  );

  const { data: suggestProducts } = useGetSuggestByRecentViewed(adultYn);
  const hasRecentViewedProducts =
    (recentlyViewedProducts?.data?.length ?? 0) > 0;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const data = useMemo(() => {
    return activeTab === "recentlyView"
      ? recentlyViewedProducts?.data
      : suggestProducts?.data;
  }, [activeTab, recentlyViewedProducts, suggestProducts]);

  // Filter tabs based on authentication
  const tabs = useMemo(() => {
    const allTabs = [
      { label: "최근 본 작품", value: "recentlyView" },
      { label: "본 작품 기반 추천", value: "suggest" },
    ];

    // Hide "recentlyView" tab if not authenticated
    if (!isAuthenticated) {
      return [];
    }

    return allTabs;
  }, [isAuthenticated]);

  if (!isAuthenticated || !hasRecentViewedProducts) {
    return <></>;
  }

  return (
    <>
      {/* {recentlyViewedProducts.length === 0 ? (
        <></>
      ) : ( */}
      <>
        <div>
          <div className="flex justify-between pl-16pxr md:pl-0">
            <Tab
              tabs={tabs}
              style="basic"
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
            {data && data.length > 0 && activeTab === "recentlyView" && (
              <button
                className="flex items-center gap-8pxr p-2"
                onClick={() => {
                  router.push("/product/preference/last-viewed");
                }}
              >
                <span className="text-dark-gray-300 text-14pxr font-medium pr-16pxr md:pr-0">
                  더보기
                </span>
                <ArrowRightSmall className="text-dark-gray-300 hidden md:block" />
              </button>
            )}
          </div>
          <div className="overflow-auto scroll-hidden">
            {data?.length === 0 ? (
              <span className="text-dark-gray-400">
                {activeTab === "suggest" ? "추천 작품" : "최근 본 작품"}이
                없습니다.
              </span>
            ) : (
              <>
                <div className="flex gap-10pxr md:gap-15pxr w-[800px] md:w-[1120px] pl-16pxr md:pl-0 mt-10pxr">
                  {data?.map((product: IProduct) => (
                    <div
                      key={product.productId}
                      className="flex flex-col gap-9pxr cursor-pointer"
                      onClick={() => {
                        setPendingProductDetailEntrySource(
                          product.productId,
                          activeTab === "recentlyView"
                            ? PRODUCT_DETAIL_ENTRY_SOURCE.HOME_RECENTLY_VIEWED
                            : PRODUCT_DETAIL_ENTRY_SOURCE.HOME_RECENT_BASED_RECOMMEND
                        );
                        router.push(buildProductDetailPath(product.productId));
                      }}
                    >
                      {(product.image && product.image.coverImagePath) ||
                      product.coverImagePath ? (
                        <Image
                          src={
                            product?.image?.coverImagePath ||
                            product.coverImagePath ||
                            "https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
                          }
                          alt={product.title}
                          width={97}
                          height={146}
                          className="object-cover w-[67px] md:w-[97px] h-[100px] md:h-[146px] rounded-[10px]"
                        />
                      ) : (
                        <Image
                          src="https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
                          alt={product.title}
                          width={97}
                          height={146}
                          className={`object-cover w-[67px] md:w-[97px] h-[100px] md:h-[146px] rounded-[10px]`}
                        />
                      )}
                      <span className="w-[67px] md:w-[92px] text-13pxr md:text-14pxr font-medium line-clamp-1 leading-[16px]">
                        {product.title}
                      </span>
                      <UserNickname
                        userNickname={
                          product.authorNickname || product.authorName || ""
                        }
                        product={product as unknown as IProduct}
                        textStyle="max-w-[72px] md:max-w-[90px] text-10pxr md:text-12pxr text-dark-gray-400"
                        badgeStyle="w-[10px] h-[12px]"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </>
      {/* )} */}
    </>
  );
};
export default RecentlyView;
