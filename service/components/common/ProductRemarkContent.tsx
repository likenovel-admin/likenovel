import { IProduct, IRole } from "@/types";
import { useEffect, useRef, useState } from "react";
import Check from "/public/images/check.svg";
import QuestionMark from "/public/images/question-mark.svg";
import Won from "/public/images/won.svg";

interface Props {
  data: IProduct;
  remarkContent: string;
  isFree: boolean;
}

// TODO: user에서 role을 꺼내와서 업데이트하는 로직 필요
const ProductRemarkContent = ({ data, remarkContent, isFree }: Props) => {
  const role: IRole = "user";
  const [isShowDiv, setIsShowDiv] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 유니코드로 받침 판단 후 조사를 붙이는 함수
  const addPostfixProduct = (text: string) => {
    const lastChar = text[text.length - 1] || "";
    const lastCharCode = lastChar.length && lastChar.charCodeAt(0);
    const hasFinalConsonant = (lastCharCode - 0xac00) % 28 !== 0;
    return hasFinalConsonant ? `${text}과` : `${text}와`;
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(event.target as Node)
    ) {
      setIsShowDiv(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const renderSimilarProductContent = () => (
    <div ref={containerRef}>
      <div className="hidden md:flex items-center gap-6pxr">
        <div className="flex justify-center items-center min-w-[14px] min-h-[14px] bg-green-100 rounded-full">
          <Check className="w-[7px] h-[5px] text-white" />
        </div>
        <span className="text-14pxr text-green-100">
          {/* 내가 본 {addPostfixProduct(remarkContent)} 약간 비슷 */}
          {remarkContent}
        </span>
      </div>
      <div className="md:hidden relative">
        <div
          className="flex justify-center items-center w-[18px] h-[18px] rounded-full bg-green-100"
          onClick={() => setIsShowDiv(!isShowDiv)}
        >
          <Check className="w-[10px] h-[9px] text-white" />
        </div>
        {isShowDiv && renderSimilarProductDiv()}
      </div>
    </div>
  );

  const renderAdvancePaymentContent = () => (
    <div ref={containerRef}>
      <div className="hidden md:flex items-center gap-6pxr">
        <div className="flex justify-center items-center w-[14px] h-[14px] bg-[#FFA439] rounded-full">
          <Won className="w-[9px] h-[5px] ml-[1px] text-black-200" />
        </div>
        <span className="text-14pxr text-red-200">
          선인세 제안 범위 {remarkContent}
        </span>
      </div>
      <div className="md:hidden relative">
        <div
          className="flex justify-center items-center w-[18px] h-[18px] rounded-full bg-[#FFA439]"
          onClick={() => setIsShowDiv(!isShowDiv)}
        >
          <Won className="w-[12px] h-[10px] ml-[1px] text-black-200" />
        </div>
        {isShowDiv && renderFreeProductDiv()}
      </div>
    </div>
  );

  const renderSimilarProductDiv = () => {
    return (
      <div ref={containerRef}>
        <div className="absolute bottom-[23px] right-[-30px] flex flex-shrink gap-[5px] z-10 min-w-[150px] min-h-[50px] rounded-[10px] bg-green-100 p-[10px]">
          <div className="flex justify-center items-center min-w-[18px] h-[18px] rounded-full bg-white">
            <Check className="w-[10px] h-[9px] text-green-100" />
          </div>
          <span className="text-white text-11pxr">
            내가 본 {addPostfixProduct(remarkContent)} 약간 비슷
          </span>
        </div>
      </div>
    );
  };

  const renderFreeProductDiv = () => {
    if (!data.trendindex || !data.properties) return null;
    return (
      <div className="absolute bottom-[23px] right-[-30px] flex flex-col z-10 min-w-[220px] min-h-[120px] rounded-[10px] bg-white">
        <div className="border border-t-light-gray-500 border-l-light-gray-500 border-r-light-gray-500 border-b-0 rounded-t-[10px] p-[10px]">
          <>
            <div className="flex justify-between">
              <span className="text-11pxr text-dark-gray-300">CP조회수</span>
              <span className="text-11pxr text-dark-gray-500">
                {data?.trendindex.cpHitCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-11pxr text-dark-gray-300">연독률</span>
              <span className="text-11pxr text-dark-gray-500">
                {data?.trendindex.readThroughRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-11pxr text-dark-gray-300">
                주평균 연재횟수
              </span>
              <span className="text-11pxr text-dark-gray-500">
                {data?.properties.averageWeeklyEpisodes}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-11pxr text-dark-gray-300">주요 독자층</span>
              <span className="text-11pxr text-dark-gray-500">
                {data?.trendindex.primaryReaderGroup?.["1"] ?? ""} <br />
                {data?.trendindex.primaryReaderGroup?.["2"] ?? ""}
              </span>
            </div>
          </>
        </div>
        <div className="flex gap-[5px] bg-[#FFA439] rounded-b-[10px] p-[7px]">
          <div className="flex justify-center items-center min-w-[18px] h-[18px] rounded-full bg-white">
            <Won className="w-[10px] h-[9px] text-[#FFA439]" />
          </div>
          <span className="text-white text-11pxr">
            {/* 선인세 제안 범위 {remarkContent}
             */}
            선인세 제안 범위 50만원~100만원
          </span>
        </div>
      </div>
    );
  };

  const renderPaidProductDiv = () => {
    if (!data.trendindex || !data.properties) return null;
    return (
      <div ref={containerRef}>
        <div className="absolute bottom-[23px] right-[-30px] flex flex-col z-10 min-w-[200px] min-h-[100px] rounded-[10px] bg-white p-[10px] border border-light-gray-500">
          <>
            <div className="flex justify-between">
              <span className="text-11pxr text-dark-gray-300">CP조회수</span>
              <span className="text-11pxr text-dark-gray-500">
                {data?.trendindex.cpHitCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-11pxr text-dark-gray-300">연독률</span>
              <span className="text-11pxr text-dark-gray-500">
                {data?.trendindex.readThroughRate}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-11pxr text-dark-gray-300">
                주평균 연재횟수
              </span>
              <span className="text-11pxr text-dark-gray-500">
                {data?.properties.averageWeeklyEpisodes}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-11pxr text-dark-gray-300">주요 독자층</span>
              <span className="text-11pxr text-dark-gray-500">
                {data?.trendindex.primaryReaderGroup?.["1"] ?? ""} <br />
                {data?.trendindex.primaryReaderGroup?.["2"] ?? ""}
              </span>
            </div>
          </>
        </div>
      </div>
    );
  };

  const renderPaidProductCircle = () => (
    <div className="md:hidden relative">
      <div
        className="flex justify-center items-center w-[18px] h-[18px] rounded-full bg-dark-gray-400"
        onClick={() => setIsShowDiv(!isShowDiv)}
      >
        <QuestionMark className="w-[9px] h-[11px] text-white" />
      </div>
      {isShowDiv && renderPaidProductDiv()}
    </div>
  );

  //@ts-ignore
  if (role === "user" || role === "author") {
    return data.properties && data?.properties.remarkContentSnippet
      ? renderSimilarProductContent()
      : null;
  }
  //@ts-ignore
  if (role === "CP" || role === "editor") {
    return isFree ? renderAdvancePaymentContent() : renderPaidProductCircle();
  }
};

export default ProductRemarkContent;
