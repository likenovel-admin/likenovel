import { useSelectUserCash } from "@/app/api/query/mypage/user";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Spinner from "../common/Spinner";
import Tab from "../common/Tab";
import CashUseItem from "./CashUseItem";

const CASH_HISTORY_PAGE_SIZE = 30;

const CashUseHistory = () => {
  const [category, setCategory] = useState<"all" | "charge" | "used">("all");
  const [page, setPage] = useState(1);
  const { data: cashData, isFetching, isLoading } = useSelectUserCash({
    category,
    page,
    pageSize: CASH_HISTORY_PAGE_SIZE,
  });
  const cashItems = cashData?.data ?? [];
  const totalCount = cashData?.totalCount ?? cashItems.length;
  const hasPrev = page > 1;
  const hasNext = cashData?.hasNext ?? false;

  return (
    <div className="flex justify-start w-full mt-4">
      <div className="flex flex-col gap-2 w-full">
        <Tab
          activeTab={category}
          onTabChange={(value) => {
            setCategory(value as "all" | "charge" | "used");
            setPage(1);
          }}
          tabs={[
            {
              label: "전체",
              value: "all",
            },
            {
              label: "충전",
              value: "charge",
            },
            {
              label: "사용",
              value: "used",
            },
          ]}
          style="check"
        />
        {isLoading ? (
          <>
            <Spinner />
          </>
        ) : (
          <>
            {cashItems.length > 0 ? (
              cashItems.map((item, index) => (
                <CashUseItem key={index} {...item} />
              ))
            ) : (
              <div className="text-center py-20 text-dark-gray-400">
                캐시 사용 내역이 없습니다.
              </div>
            )}
            {totalCount > CASH_HISTORY_PAGE_SIZE && (
              <div className="flex items-center justify-between pt-4 text-12pxr md:text-14pxr text-dark-gray-400">
                <span>
                  총 {totalCount.toLocaleString()}건 · {page}페이지
                </span>
                <div className="flex gap-8pxr">
                  <button
                    type="button"
                    disabled={!hasPrev || isFetching}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className="h-[36px] px-14pxr rounded-[10px] border border-light-gray-500 disabled:opacity-40"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    disabled={!hasNext || isFetching}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="h-[36px] px-14pxr rounded-[10px] border border-light-gray-500 disabled:opacity-40"
                  >
                    다음
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CashUseHistory;
