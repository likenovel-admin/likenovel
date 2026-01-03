import { useSelectAutoComplete } from "@/app/api/query/search";
import useAuthStore from "@/store/authStore";
import useSearchModalStore from "@/store/searchModalStore";
import { debounce } from "es-toolkit";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Close from "/public/images/close.svg";
import Search from "/public/images/search.svg";
import Trash from "/public/images/trash.svg";

interface IAutoCompleteData {
  key: string;
  content: string;
}
interface Props {
  inputWidth?: number;
  pageType?: "search" | "result";
  searchKeyword?: string;
}
const MAX_HISTORY_LENGTH = 10;
const sampleAutoCompleteData: IAutoCompleteData[] = [
  { key: "product", content: "나의 작은 히어로를 위해 - 김작가" },
  { key: "keyword", content: "회귀복수물" },
  {
    key: "product",
    content: "세계전복급 악역으로 오해받고 있습니다 - 로스티플",
  },
  { key: "product", content: "이런 영웅은 싫어 - 히어로군" },
  { key: "event", content: "대여권 원플원 페스티벌" },
];
const NormalSearch = ({
  inputWidth,
  pageType = "search",
  searchKeyword,
}: Props) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { closeSearchModal } = useSearchModalStore();
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isAutoCompleteVisible, setAutoCompleteVisible] = useState(false);
  const [value, setValue] = useState(searchKeyword || "");
  const [hasRemoveButton, setHasRemoveButton] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const adultYn = user?.isOnAdult ? "Y" : "N";
  const { data, isSuccess } = useSelectAutoComplete(value, adultYn);

  const sortAutoCompleteData = (data: IAutoCompleteData[]) => {
    const priority: { [key: string]: number } = {
      product: 1,
      keyword: 2,
      event: 3,
    };
    return data.sort((a, b) => priority[a.key] - priority[b.key]);
  };

  const sortedAutoCompleteData = useMemo(() => {
    if (!data?.data) return [];

    // Transform IProduct[] to IAutoCompleteData[]
    const transformedData: IAutoCompleteData[] = data.data
      .filter((item) => item?.title) // Filter out invalid products
      .map((item) => ({
        key: "product",
        content: `${item.title} - ${item.authorNickname || ""}`.trim(),
      }));

    return sortAutoCompleteData(transformedData);
  }, [data]);

  const getHighlightedText = (text: string, highlight: string) => {
    if (!text || typeof text !== "string") return text;
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <strong key={index} className="font-bold text-black-100">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  const hasChosung = (value: string) => {
    const choSungRange = /[ㄱ-ㅎ]/;
    return choSungRange.test(value);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleInputChange = useCallback(
    debounce((value) => {
      if (value.length > 1 && value.trim() !== "" && !hasChosung(value)) {
        // TODO: 오토컴플릿 API 호출
        setAutoCompleteVisible(true);
        setDropdownVisible(false);
      }
    }, 300),
    [setAutoCompleteVisible, setDropdownVisible, hasChosung]
  );

  const onChange = (e: { target: { value: any } }) => {
    const { value } = e.target;
    setValue(value);
    if (value.length > 0) {
      setHasRemoveButton(true);
    } else {
      setHasRemoveButton(false);
      setAutoCompleteVisible(false);
    }
    setDropdownVisible(!isAutoCompleteVisible);
    handleInputChange(value);
  };

  const updateLocalStorage = (newHistory: string[]) => {
    localStorage.setItem("searchHistory", JSON.stringify(newHistory));
    setSearchHistory(newHistory);
  };

  const addSearchHistory = () => {
    if (value.trim() === "") return;
    const storedHistory = JSON.parse(
      localStorage.getItem("searchHistory") || "[]"
    );
    const updatedHistory = [
      value,
      ...storedHistory.filter((item: string) => item !== value),
    ];
    const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_LENGTH);
    updateLocalStorage(limitedHistory);
  };

  const deleteHistoryItem = (index: number) => {
    const updatedHistory = searchHistory.filter((_, i) => i !== index);
    updateLocalStorage(updatedHistory);
  };

  const clearAllHistory = () => {
    updateLocalStorage([]);
  };

  useEffect(() => {
    const storedHistory = JSON.parse(
      localStorage.getItem("searchHistory") || "[]"
    );
    setSearchHistory(storedHistory);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (!event.target.closest(".search-bar")) {
        setDropdownVisible(false);
        setAutoCompleteVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchKeyword) {
      setValue(searchKeyword);
    }
  }, [searchKeyword]);

  return (
    <div
      className={`relative w-full mx-auto mt-20pxr search-bar`}
      style={{ maxWidth: inputWidth ? `${inputWidth}px` : "570px" }}
    >
      <div className="relative">
        <input
          type="text"
          placeholder="작품명, 작가명, 태그입력"
          className={`w-full h-[40px] md:h-[60px] p-2 pl-28pxr border border-light-gray-600 rounded-[100px] focus:outline-none focus:border-primary-100 shadow-md`}
          onChange={onChange}
          onFocus={() => setDropdownVisible(true)}
          value={value}
          maxLength={50}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              // TODO: 검색 api 연결
              addSearchHistory();
              closeSearchModal();
              router.push(`/product/search/result/normal?keyword=${value}`);
              // Add timestamp to force refetch even with same keyword
              // router.push(`/product/search/result/normal?keyword=${value}&t=${Date.now()}`);
            }
          }}
        />
        {hasRemoveButton && (
          <button
            className="flex justify-center items-center absolute top-[10px] md:top-[19px] right-[45px] md:right-[60px] w-[19px] h-[19px] md:w-[22px] md:h-[22px] bg-dark-gray-400 rounded-full hover:bg-dark-gray-100"
            onClick={() => {
              setValue("");
              setHasRemoveButton(false);
              setAutoCompleteVisible(false);
            }}
          >
            <Close className="text-white w-[7px]" />
          </button>
        )}
        <button
          className="absolute top-[11px] md:top-[20px] right-[15px] md:right-[25px]"
          onClick={() => {
            // TODO: 검색 api 연결
            addSearchHistory();
            closeSearchModal();
            // Add timestamp to force refetch even with same keyword
            router.push(
              `/product/search/result/normal?keyword=${value}&t=${Date.now()}`
            );
          }}
        >
          <Search className="w-[20px] h-[20px] hover:text-primary-100" />
        </button>
      </div>
      {isDropdownVisible && searchHistory.length > 0 && (
        <div className="absolute w-full mt-1 bg-white border border-light-gray-600 rounded-[16px] shadow-md z-10">
          <div className="flex justify-between pt-20pxr px-20pxr pb-13pxr">
            <span className="text-16pxr font-semibold">최근 검색 기록</span>
            <button
              className="text-14pxr text-right text-dark-gray-200 hover:text-dark-gray-600"
              onClick={clearAllHistory}
            >
              전체삭제
            </button>
          </div>
          <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0" />
          <div className="p-20pxr">
            {searchHistory.map((item: string, index: number) => (
              <div className="flex justify-between" key={index}>
                <div
                  className="flex items-center w-[500px] p-1 hover:bg-light-gray-100 rounded-[10px] cursor-pointer"
                  // TODO: 검색 api 연결
                  onClick={() => {
                    closeSearchModal();
                    setDropdownVisible(false);
                    router.push(
                      `/product/search/result/normal?keyword=${item}`
                    );
                  }}
                >
                  <span className="text-dark-gray-400">{item}</span>
                </div>
                <button
                  onClick={() => {
                    deleteHistoryItem(index);
                  }}
                >
                  <Trash className="text-gray-400 hover:text-black-100" />
                </button>
              </div>
            ))}
          </div>
          <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0 mt-10pxr" />
          <div className="flex justify-end pt-10pxr pb-15pxr px-20pxr bg-[#FAFAFA] rounded-b-[16px]">
            <button
              className="text-14pxr text-right text-dark-gray-200 hover:text-dark-gray-400"
              onClick={() => setDropdownVisible(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
      {isAutoCompleteVisible && sortedAutoCompleteData.length > 0 && (
        <div className="absolute w-full mt-1 bg-white border border-light-gray-600 rounded-[16px] shadow-md z-10">
          <div className="p-20pxr">
            {sortedAutoCompleteData.map(
              (item: { key: string; content: string }, index: number) => (
                <div
                  key={index}
                  className="flex items-center p-1 hover:bg-light-gray-100 rounded-[10px] cursor-pointer"
                  // TODO: 검색 api 연결
                  onClick={() => {}}
                >
                  <span className="text-dark-gray-400">
                    {getHighlightedText(item.content, value)}
                  </span>
                  <span className="text-dark-gray-100 text-12pxr">
                    &nbsp;&bull;&nbsp;
                    {item.key === "product"
                      ? "작품"
                      : item.key === "author"
                      ? "작가"
                      : item.key === "keyword"
                      ? "키워드"
                      : item.key === "event"
                      ? "이벤트"
                      : ""}
                  </span>
                </div>
              )
            )}
          </div>
          <div className="w-full border border-t-light-gray-400 border-b-0 border-l-0 border-r-0 mt-10pxr" />
          <div className="flex justify-end pt-10pxr pb-15pxr px-20pxr bg-[#FAFAFA] rounded-b-[16px]">
            <button
              className="text-14pxr text-right text-dark-gray-200 hover:text-dark-gray-400"
              onClick={() => setAutoCompleteVisible(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default NormalSearch;
