"use client";
import ProductArea from "@/components/search/result/ProductArea";
import StorySearch from "@/components/search/StorySearch";
import data from "@/public/test/mixedProducts.json";
import { IProduct } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const sampleData = { keyword: "판타지", resultCount: 271 };

export default function StorySearchResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("story");
  const [keyword, setKeyword] = useState("");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  useEffect(() => {
    if (activeTab === "normal") {
      router.push("/product/search/result/normal");
    }
  }, [activeTab, router]);

  useEffect(() => {
    const keywordParam = searchParams.get("keyword");
    if (keywordParam) {
      setKeyword(keywordParam);
    }
  }, [searchParams]);

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
      <StorySearch pageType="result" searchKeyword={keyword} />
      <div className="flex mt-20pxr">
        <span className="text-20pxr">총</span>
        <span className="text-20pxr font-semibold text-primary-100">
          &nbsp;{sampleData.resultCount}건
        </span>
        <span className="text-20pxr">의 전체 검색결과가 있습니다.</span>
      </div>
      <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0 mt-20pxr" />
      {/* TODO: 검색 종류에 따라 다른 데이터 전달 */}
      <ProductArea data={data as unknown as IProduct[]} />
    </div>
  );
}
