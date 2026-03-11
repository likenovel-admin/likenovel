import Spinner from "@/components/common/Spinner";

interface Props {
  keyword: string;
  isSuccess: boolean;
  resultCount?: number;
}

const SearchResultMessage = ({ keyword, isSuccess, resultCount }: Props) => {
  return (
    <div className="flex mt-20pxr px-20pxr">
        {!isSuccess ? (
            <div className="flex items-center gap-2">
                <Spinner size={20} />
            </div>
        ) : (
            <div className="whitespace-wrap md:flex md:whitespace-nowrap">
                <div className="text-20pxr whitespace-wrap">
                    <span className="font-semibold text-primary-100">&apos;{keyword}&apos;</span>                    
                    <span className="text-20pxr text-black font-normal">에 대해</span>
                </div>                
                {(resultCount ?? 0) === 0 ? (                    
                    <span className="text-20pxr">검색결과가 없습니다.</span>
                ) : (
                    <div className="flex-1">                                                
                        <span className="text-20pxr font-semibold text-primary-100">
                            &nbsp;{resultCount}건
                        </span>
                        <span className="text-20pxr">의 전체 검색결과가 있습니다.</span>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default SearchResultMessage;