"use client";
import {
  useSelectSearchResult,
  useSelectTrendingKeywords,
} from "@/app/api/query/search";
import NormalSearch from "@/components/search/NormalSearch";
import OngoingEvent from "@/components/search/OngoingEvent";
import ProductArea from "@/components/search/result/ProductArea";
import SearchResultMessage from "@/components/search/result/SearchResultMessage";
import TrendingSearchWord from "@/components/search/TrendingSearchWord";
import useAuthStore from "@/store/authStore";
import { IProduct } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function NormalSearchResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("normal");
  const [keyword, setKeyword] = useState("");
  const [orderby, setOrderby] = useState("update");

  const adultYn = useMemo(() => {
    if (user?.isOnAdult) {
      return "Y";
    }
    return "N";
  }, [user?.isOnAdult]);
  const {
    data: searchResult,
    isSuccess,
    refetch: refetchSearch,
  } = useSelectSearchResult(keyword, adultYn, orderby);
  const { data: trendingKeywords, isSuccess: isTrendingKeywordsSuccess } =
    useSelectTrendingKeywords();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  useEffect(() => {
    if (activeTab === "story") {
      router.push("/product/search/result/story");
    }
  }, [activeTab, router]);

  useEffect(() => {
    const keywordParam = searchParams.get("keyword");
    const orderbyParam = searchParams.get("orderby");
    if (keywordParam) {
      setKeyword(keywordParam);
      if (orderbyParam) {
        setOrderby(orderbyParam);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    refetchSearch();
  }, [adultYn]);

  return (
    <div className="flex flex-col w-full max-w-[1120px] mx-auto items-center mt-20pxr gap-20pxr">
      <span className="text-24pxr font-bold mb-23pxr">통합검색</span>
      {/* <Tab
        tabs={[
          { label: "일반 검색", value: "normal" },
          { label: "스토리 검색", value: "story" }, // Hidden: 스토리 검색 현재 기한 과업 제외
        ]}
        style="halfSquare"
        activeTab={activeTab}
        onTabChange={handleTabChange}
      /> */}
      <NormalSearch
        inputWidth={770}
        pageType="result"
        searchKeyword={keyword}
      />

      <div className="flex flex-wrap gap-5pxr mt-14pxr">
        <TrendingSearchWord isTitle={false} limit={5} />
      </div>
      {keyword && (
        <SearchResultMessage
          keyword={keyword}
          isSuccess={isSuccess}
          resultCount={searchResult?.data?.products?.length ?? 0}
        />
      )}

      {keyword &&
        searchResult?.data?.products &&
        searchResult.data.products.length > 0 && (
          <>
            <div className="w-full border border-t-light-gray-300 border-b-0 border-l-0 border-r-0 mt-20pxr" />
            <ProductArea
              data={searchResult.data.products as unknown as IProduct[]}
              keyword={keyword}
            />
          </>
        )}
      {keyword &&
        searchResult?.data?.events &&
        searchResult.data.events.length > 0 && (
          <>
            <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0 mt-20pxr" />
            <OngoingEvent
              pageType="result"
              events={searchResult.data.events || []}
            />
          </>
        )}
    </div>
  );
}
