import DirectInputSearchTag from "../form/directInputSearchTag";

const DirectSearchTag = () => {
  const labelClassName =
    "text-13pxr md:text-16pxr text-dark-gray-500 font-semibold";
  const inputTextClassName =
    "text-14pxr md:text-16pxr h-40pxr flex-1 md:h-44pxr text-dark-gray-500 placeholder:text-dark-gray-100 pl-9pxr pr-11pxr";
  return (
    <DirectInputSearchTag
      label={"직접 입력 태그"}
      labelStyle={labelClassName}
      className={inputTextClassName}
      maximumSelected={3}
      placeholder="태그를 입력하세요"
    />
  );
};

export default DirectSearchTag;
