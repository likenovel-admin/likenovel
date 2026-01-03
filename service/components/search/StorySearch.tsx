import useSearchModalStore from "@/store/searchModalStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Refresh from "/public/images/refresh-two-arrow.svg";
import Search from "/public/images/search.svg";
interface Props {
  pageType?: "search" | "result";
  searchKeyword?: string;
}

const sampleData = {
  story:
    "일용직으로 힘들게 사는 아저씨가 하루는 돈을 많이 벌어서 기분 좋게 맛있는 음식을 사들고 집에 갔는데 아내가 죽어있는 비극적인 이야기. 배경은 멀지 않은 근현대.",
};
const StorySearch = ({ pageType = "search", searchKeyword }: Props) => {
  const router = useRouter();
  const { closeSearchModal } = useSearchModalStore();
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInputValue(textarea.value);
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    if (searchKeyword) {
      setInputValue(searchKeyword);
    } else if (pageType === "result") {
      // Fallback to sample data if no keyword provided
      setInputValue(sampleData.story);
    }
  }, [searchKeyword, pageType]);
  return (
    <div
      className={`relative w-full ${
        pageType === "search" ? "max-w-[640px]" : "max-w-[770px]"
      } mx-auto mt-20pxr search-bar`}
    >
      <div
        className={`flex flex-col w-full mt-1 bg-white border border-light-gray-600 rounded-[16px] shadow-md pt-20pxr pb-13pxr px-27pxr ${
          isFocused ? "border-primary-100" : "border-light-gray-600"
        }`}
      >
        {pageType === "search" && (
          <span className="text-dark-gray-300 mb-8pxr">
            찾고자 하는 줄거리를 줄바꿈 없이 쭉 입력해주세요!
          </span>
        )}
        <textarea
          className="text-14pxr resize-none border-none focus:outline-none mb-40pxr"
          placeholder="(예시) 일용직으로 힘들게 사는 아저씨가 하루는 돈을 많이 벌어서 기분 좋게 맛있는 음식을 사들고 집에 갔는데 아내가 죽어있는 비극적인 이야기. 배경은 멀지 않은 근현대."
          value={inputValue}
          onChange={handleChange}
          maxLength={5000}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            minHeight: "100px",
            overflow: "hidden",
          }}
        ></textarea>
        <div className="absolute bottom-[15px] right-[15px] flex items-center gap-10pxr">
          <div className="flex">
            <span className="text-13pxr">{inputValue.length}</span>&nbsp;
            <span className="text-13pxr text-dark-gray-100">/ 5,000자</span>
          </div>
          {pageType === "result" && (
            <button
              className="flex justify-center items-center w-[35px] h-[35px] hover:text-primary-100"
              onClick={() => {
                setInputValue("");
              }}
            >
              <Refresh />
            </button>
          )}
          <button
            className="flex justify-center items-center w-[35px] h-[35px] rounded-full bg-light-gray-200 hover:bg-light-gray-400 hover:text-primary-100"
            onClick={() => {
              if (pageType === "search") {
                router.push(`/product/search/result/story?keyword=${inputValue}`);
                closeSearchModal();
              } else {
                router.push(`/product/search/result/story?keyword=${inputValue}`);
              }
            }}
          >
            <Search className="w-[15px] h-[15px]" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default StorySearch;
