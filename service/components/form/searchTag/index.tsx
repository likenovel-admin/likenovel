import useForOutsideClicks from "@/hooks/useForOutsideClicks";
import useToastStore from "@/store/toastStore";
import {
  Dispatch,
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  Ref,
  SetStateAction,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFormContext } from "react-hook-form";
import CloseButton from "/public/images/close.svg";
type SearchListType = {
  title: string;
  list: CommonSelectItem[];
}[];
interface SearchKeywordProps extends InputHTMLAttributes<HTMLInputElement> {
  searchList?: SearchListType;
  isError?: boolean;
  additionalText?: ReactNode;
  full?: boolean;
  label?: string;
  labelStyle?: string;
  gap?: string;
  maximumSelected?: number;
  selectedTag?: string;
}

const SearchTag = forwardRef(function SearchKeywordComponent(
  {
    placeholder,
    isError,
    className,
    additionalText,
    searchList,
    full,
    label,
    labelStyle,
    gap,
    maximumSelected,
    ...props
  }: SearchKeywordProps,
  ref: Ref<HTMLInputElement>
) {
  const { watch, setValue } = useFormContext();

  const baseTag: CommonSelectItem[] = watch("baseTag") ?? [];
  const [showSearchList, setShowSearchList] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [selectedList, setSelectedList] = useState<CommonSelectItem[]>([]);

  const inputErrorStyle = useMemo(() => {
    return isError
      ? "border-[2px] border-red-100 bg-[#FFF4F4]"
      : "border border-light-gray-500";
  }, [isError]);

  const combinedList = useMemo(() => {
    const allTags = [...baseTag, ...selectedList];
    return allTags.filter(
      (tag, index, self) =>
        self.findIndex((t) => t.value === tag.value) === index
    );
  }, [baseTag, selectedList]);

  const isShowSearchList = useMemo(() => {
    const flatSearchList = searchList?.flat();
    return flatSearchList && flatSearchList.length > 0 && showSearchList;
  }, [searchList, showSearchList]);

  const filteredSearchList = useMemo(() => {
    if (!searchList) return [];
    return searchList
      .map((item) => {
        const list = item.list?.filter((tag) =>
          tag.label.includes(keyword.trim())
        );
        return (list?.length ?? 0) > 0 ? { title: item.title, list } : null;
      })
      .filter((item) => item !== null) as SearchListType;
  }, [keyword, searchList]);

  const searchListRef = useRef<HTMLDivElement>(null);

  const handleTagClick = (tag: CommonSelectItem) => {
    const isInBaseTag = baseTag.some((base) => base.value === tag.value);

    if (isInBaseTag) {
      const updatedBaseTag = baseTag.filter((base) => base.value !== tag.value);
      setValue("baseTag", updatedBaseTag);
    } else {
      setValue("baseTag", [...baseTag, tag]);
    }
  };

  useForOutsideClicks({
    element: searchListRef.current,
    onClose() {
      setShowSearchList(false);
    },
  });

  return (
    <div
      className={`flex-column gap-[8px] mb-[10px] relative ${
        full ? "w-full" : ""
      }`}
    >
      <div className={`flex flex-col gap-3`}>
        <div className={`min-w-[100px] ${labelStyle}`}>
          <div className="flex gap-2 items-center">
            <span className={"text-13pxr md:text-16pxr text-dark-gray-500 "}>
              {label}
            </span>
            <span className={"text-13pxr text-dark-gray-300"}>
              <span className={"text-dark-gray-500"}>
                {combinedList.length}
              </span>
              {maximumSelected ? ` / ${maximumSelected}` : ""}개
            </span>
          </div>
          <div className={"flex gap-2 mt-2 flex-wrap"}>
            <div className={"flex gap-2 mt-2 flex-wrap"}>
              {combinedList.map((tag) => (
                <TagItem
                  key={tag.value}
                  label={tag.label}
                  onClick={() => handleTagClick(tag)}
                />
              ))}
            </div>
          </div>
        </div>
        <div
          className="relative flex items-center flex-col"
          ref={searchListRef}
        >
          <input
            ref={ref}
            placeholder={placeholder}
            className={`${inputErrorStyle} rounded-[8px] pl-[15px] ${className}`}
            {...props}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onFocus={() => setShowSearchList(true)}
          />
          <div className="relative w-full">
            {isShowSearchList && (
              <TagArea
                searchList={filteredSearchList}
                selectedList={selectedList}
                setSelectedList={setSelectedList}
                maximumSelected={maximumSelected}
              />
            )}
          </div>
        </div>
        <div className="self-start text-dark-gray-300 text-13pxr">
          {`${label}는 최대 ${maximumSelected}개까지 입력 가능합니다.`}
        </div>
      </div>
    </div>
  );
});

const TagArea = ({
  setSelectedList,
  selectedList,
  searchList,
  maximumSelected,
}: {
  searchList: SearchListType | null;
  selectedList: CommonSelectItem[];
  maximumSelected?: number;
  setSelectedList: Dispatch<SetStateAction<CommonSelectItem[]>>;
}) => {
  const { watch, setValue } = useFormContext();
  const { setToast } = useToastStore();

  const baseTag: CommonSelectItem[] = watch("baseTag") ?? [];

  return (
    <section className="absolute z-10 w-full bg-white border border-light-gray-500 rounded-[8px] mt-[5px] p-4">
      {searchList?.map((item) => {
        if (!item || item.list.length === 0) return null;
        return (
          <article key={item.title}>
            <label className="text-14pxr">
              {item.title}{" "}
              <span className="text-primary-100">{item.list.length}</span>
            </label>
            <div className="py-4 flex flex-wrap gap-2">
              {item.list.map((tag) => {
                const isInBaseTag = baseTag.some(
                  (base) => base.value === tag.value
                );
                const isInSelectedList = selectedList.some(
                  (selected) => selected.value === tag.value
                );
                const isActive = isInBaseTag || isInSelectedList;
                return (
                  <div
                    key={tag.value}
                    className={`h-[33px] p-[10px] cursor-pointer min-w-fit flex items-center justify-center rounded-full py-2 px-3 font-normal text-13pxr text-dark-gray-400 ${
                      isActive
                        ? "bg-black-100 text-white"
                        : "border border-light-gray-300"
                    }`}
                    onClick={() => {
                      if (isInBaseTag) {
                        const updatedBaseTag = baseTag.filter(
                          (base) => base.value !== tag.value
                        );
                        setValue("baseTag", updatedBaseTag);
                      } else if (isInSelectedList) {
                        setSelectedList((prev) =>
                          prev.filter(
                            (selected) => selected.value !== tag.value
                          )
                        );
                        setValue("baseTag", selectedList);
                      } else {
                        if (
                          maximumSelected &&
                          baseTag.length + selectedList.length >=
                            maximumSelected
                        ) {
                          setToast({
                            message: `최대 ${maximumSelected}개까지 선택 가능합니다.`,
                            type: "error",
                            isShowIcon: true,
                          });
                          return;
                        }
                        setValue("baseTag", [...baseTag, tag]);
                      }
                    }}
                  >
                    #{tag.label}
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
};

export const TagItem = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => {
  return (
    <article className="flex items-center gap-1 bg-light-gray-100 rounded-[90px] pl-[13px] pr-[7px] text-dark-gray-400 text-13pxr h-[34px] w-fit font-normal">
      #{label}
      <button type="button" className="w-4 p-1 md:w-[18px]" onClick={onClick}>
        <CloseButton />
      </button>
    </article>
  );
};
export default SearchTag;
