import useToastStore from "@/store/toastStore";
import { forwardRef, InputHTMLAttributes, Ref, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { TagItem } from "../searchTag";

interface DirectInputSearchKeywordProps
  extends InputHTMLAttributes<HTMLInputElement> {
  full?: boolean;
  label?: string;
  labelStyle?: string;
  maximumSelected?: number;
  selectedTag?: string;
  isError?: boolean;
}

const DirectInputSearchTag = forwardRef(
  function DirectInputSearchKeywordComponent(
    {
      placeholder,
      className,
      full,
      label,
      labelStyle,
      maximumSelected,
      isError,
      ...props
    }: DirectInputSearchKeywordProps,
    ref: Ref<HTMLInputElement>
  ) {
    const { setToast } = useToastStore();
    const { watch, setValue } = useFormContext();

    const directTag: string[] = watch("directTag") ?? [];

    const [keyword, setKeyword] = useState("");
    const [selectedList, setSelectedList] = useState<string[]>([]);

    const inputErrorStyle = useMemo(() => {
      return isError
        ? "border-[2px] border-red-100 bg-[#FFF4F4]"
        : "border border-light-gray-500";
    }, [isError]);

    const combinedList = useMemo(() => {
      const allTags = [...directTag, ...selectedList];
      return allTags.filter(
        (tag, index, self) => self.findIndex((t) => t === tag) === index
      );
    }, [directTag, selectedList]);

    const handleTagClick = (tag: string) => {
      const isInDirectTag = directTag.includes(tag);
      if (isInDirectTag) {
        const updatedDirectTag = directTag.filter((direct) => direct !== tag);
        setValue("directTag", updatedDirectTag);
      } else {
        if (maximumSelected && directTag.length >= maximumSelected) {
          setToast({
            message: `최대 ${maximumSelected}개까지 입력 가능합니다.`,
            type: "error",
          });
          return;
        }
        setValue("directTag", [...directTag, tag]);
      }
    };

    const handleAddTag = () => {
      const trimmedKeyword = keyword.trim();
      if (
        trimmedKeyword &&
        !directTag.includes(trimmedKeyword) &&
        (!maximumSelected || directTag.length < maximumSelected)
      ) {
        setValue("directTag", [...directTag, trimmedKeyword]);
        setKeyword("");
      } else if (maximumSelected && directTag.length >= maximumSelected) {
        setToast({
          message: `최대 ${maximumSelected}개까지 입력 가능합니다.`,
          type: "error",
        });
      }
    };

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
                  {directTag && directTag.length > 0
                    ? directTag.length
                    : selectedList?.length ?? 0}
                </span>
                {maximumSelected ? ` / ${maximumSelected}` : ""}개
              </span>
            </div>
          </div>
          <div
            className={`relative flex items-center flex-wrap gap-1 ${inputErrorStyle} rounded-[8px] min-h-[40px]`}
          >
            {directTag && directTag.length > 0
              ? directTag.map((tag) => (
                  <TagItem
                    key={tag}
                    label={tag}
                    onClick={() => {
                      handleTagClick(tag);
                    }}
                  />
                ))
              : selectedList?.map((selected) => (
                  <TagItem
                    key={selected}
                    label={selected}
                    onClick={() => {
                      setSelectedList((prev) => {
                        return prev.filter(
                          (selectedItem) => selectedItem !== selected
                        );
                      });
                    }}
                  />
                ))}
            <input
              ref={ref}
              placeholder={
                maximumSelected && combinedList.length >= maximumSelected
                  ? ""
                  : placeholder
              }
              className={`${className} rounded-[8px] outline-none`}
              {...props}
              value={keyword}
              onKeyUp={(event) => {
                if (event.key === " " && keyword.trim() !== "") {
                  handleAddTag();
                }
                if (event.key === "Backspace" && keyword.trim() === "") {
                  const lastTag = directTag[directTag.length - 1];
                  if (lastTag) {
                    handleTagClick(lastTag); // 마지막 태그 삭제
                  }
                }
              }}
              onChange={(event) => {
                if (maximumSelected && combinedList.length >= maximumSelected) {
                  // TODO: 컨펌으로 바꾸는 것 고려
                  setToast({
                    message: `최대 ${maximumSelected}개까지 입력 가능합니다.`,
                    type: "error",
                  });
                  return;
                }
                setKeyword(event.target.value);
              }}
            />
          </div>
          <div className="self-start text-dark-gray-300 text-13pxr">
            {`${label}는 최대 ${maximumSelected}개까지 입력 가능합니다.`} <br />
            {`태그를 입력한 후 스페이스바를 눌러주세요.`}
          </div>
        </div>
      </div>
    );
  }
);
export default DirectInputSearchTag;
