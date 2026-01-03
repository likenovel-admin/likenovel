"use client";
import useSearchModalStore from "@/store/searchModalStore";
import { useEffect, useRef, useState } from "react";
import NormalSearch from "./NormalSearch";
import OngoingEvent from "./OngoingEvent";
import RecommendProductArea from "./RecommendProductArea";
import StorySearch from "./StorySearch";
import TrendingSearchWord from "./TrendingSearchWord";
import Close from "/public/images/close.svg";

const SearchModal = () => {
  const { isOpen, isScrolled, closeSearchModal } = useSearchModalStore();
  const [activeTab, setActiveTab] = useState("normal");
  const modalRef = useRef<HTMLDivElement>(null);
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const preventScrollOutside = (e: WheelEvent) => {
    const modal = modalRef.current;
    if (modal && !modal.contains(e.target as Node)) {
      e.preventDefault();
      return;
    }
    if (modal) {
      const isScrollAtTop = modal.scrollTop === 0;
      const isScrollAtBottom =
        modal.scrollHeight - (modal.scrollTop + 100) <= modal.clientHeight;
      if (
        (isScrollAtTop && e.deltaY < 0) ||
        (isScrollAtBottom && e.deltaY > 0)
      ) {
        e.preventDefault();
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("wheel", preventScrollOutside, {
        passive: false,
      });
    } else {
      window.removeEventListener("wheel", preventScrollOutside);
    }
    return () => {
      window.removeEventListener("wheel", preventScrollOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center ${
        // TODO: 추후 상단바 알림 추가 후 isScrolled true일 때 높이 조정 필요
        // md:mt-[90px]
        isScrolled ? "md:mt-[60px]" : "md:mt-[60px]"
      }`}
    >
      <div
        className="bg-white md:rounded-[24px] md:border md:border-black-100 md:shadow-lg w-screen md:h-[calc(90vh)] md:w-[714px]"
        onClick={handleContentClick}
      >
        <div className="flex justify-end">
          <button onClick={closeSearchModal} className="mt-4 mr-4">
            <Close className="w-[15px] h-[15px]" />
          </button>
        </div>
        <div className="relative h-full flex flex-col items-center mt-7pxr">
          <div className="flex flex-col items-center w-full">
            <span className="text-18pxr md:text-24pxr font-bold">통합검색</span>
            <div className="hidden md:block absolute top-[17px] right-[90px]">
              <div className="relative inline-block px-2 py-1 text-12pxr text-white bg-primary-100 rounded-full animate-bounce">
                생각하던 바로 &apos;그 작품&apos;을 찾아줍니다.
                <div className="absolute bottom-[-4px] left-1/2 w-2 h-2 bg-primary-100 rotate-45"></div>
              </div>
            </div>
            {/* <Tab
              tabs={[
                { label: "일반 검색", value: "normal" },
                { label: "스토리 검색", value: "story" }, // Hidden: 스토리 검색 현재 기한 과업 제외
              ]}
              style="underline"
              activeTab={activeTab}
              onTabChange={handleTabChange}
            /> */}
          </div>
          <div
            className={`flex flex-col gap-28pxr md:px-30pxr overflow-y-auto scrollbar-thin scrollbar-thumb-dark-gray-100 scrollbar-track-white w-full h-[calc(90vh-60px)] ${
              // TODO: 추후 상단바 알림 추가 후 isScrolled true일 때 높이 조정 필요
              // md:h-[calc(90vh-190px)]
              isScrolled ? "md:h-[calc(90vh-150px)]" : "md:h-[calc(90vh-150px)]"
            }`}
            ref={modalRef}
          >
            {activeTab === "normal" ? (
              <div className="px-16pxr md:px-0">
                <NormalSearch />
              </div>
            ) : (
              <div className="px-16pxr md:px-0">
                <StorySearch />
              </div>
            )}
            <div className="px-16pxr md:px-0">
              <TrendingSearchWord isTitle={true} limit={0} />
            </div>
            <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0" />
            <RecommendProductArea type="mostSearched" />
            <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0" />
            <RecommendProductArea type="recommend" />
            <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0" />
            <OngoingEvent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
