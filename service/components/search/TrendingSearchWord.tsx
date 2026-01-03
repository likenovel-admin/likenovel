import { useSelectTrendingKeywords } from "@/app/api/query/search";
import Clap from "/public/images/clap.svg";

interface TrendingSearchWordProps {
  isTitle: boolean;
  limit: number;
}

const TrendingSearchWord = ({ isTitle, limit }: TrendingSearchWordProps) => {  
  
  const { data: trendingKeywords, isSuccess: isTrendingKeywordsSuccess } = useSelectTrendingKeywords();
  const keywordLimit = limit != 0 ? limit : trendingKeywords?.data?.length;
  return (
    <div className="w-full">
      {isTitle && <div className="flex items-center gap-6pxr">
        <Clap />
        <span className="font-semibold">인기 검색어</span>
      </div>}
      <div className="flex flex-wrap gap-5pxr mt-14pxr">
        {isTrendingKeywordsSuccess && trendingKeywords?.data?.slice(0, keywordLimit).map((trendingKeyword: string, index: number) => (
          <button
            key={index}
            className="bg-light-gray-100 rounded-[100px] text-11pxr md:text-13pxr text-dark-gray-400 min-w-[50px] px-10pxr md:px-12pxr py-6pxr md:py-9pxr hover:bg-light-gray-300"
          >
            {trendingKeyword}
          </button>
        ))}
      </div>
    </div>
  );
};
export default TrendingSearchWord;
