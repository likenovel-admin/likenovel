// import { useSelectTags } from "@/app/api/query/author/product";
// import { tagObject } from "@/app/api/query/author/product/dto";
// import { useMemo } from "react";
import NewDirectSearchTag from "./NewDirectSearchTag";

const NewDirectInputSearchTag = () => {
  // const { data } = useSelectTags();

  // const tags = useMemo(() => {
  //   if (!data) return [];
  //   return data?.data.map((item: tagObject) => ({
  //     title: item.category,
  //     list: item.keywords.map((keyword) => ({
  //       value: keyword,
  //       label: keyword,
  //     })),
  //   }));
  // }, [data]);

  const labelClassName =
    "text-13pxr md:text-16pxr text-dark-gray-500 font-semibold";
  const inputTextClassName =
    "text-14pxr md:text-16pxr h-40pxr md:h-44pxr text-dark-gray-500 placeholder:text-dark-gray-100 w-[100%] pl-9pxr pr-11pxr";
  return (
    <NewDirectSearchTag
      // searchList={tags}
      label={"직접 입력 태그"}
      labelStyle={labelClassName}
      className={inputTextClassName}
      maximumSelected={3}
      placeholder="태그를 입력하세요"
    />
  );
};

export default NewDirectInputSearchTag;
