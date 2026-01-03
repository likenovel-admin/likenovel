import AnalysisDataTable from "@/app/discover-products/chart/components/analysis-data-table";
import { PaginationPrevNextControls } from "@/components/common/PaginationControls";
import { calculatePageCount } from "@/lib/utils";
import { ReaderAnalysis } from "@/types/product-discovery-statistics";
import React, { useMemo, useState } from "react";

const ITEMS_PER_PAGE = 5;
export default function TargetReaderAnalysisDetails({
  data,
}: {
  data: ReaderAnalysis[];
}) {
  const [page, setPage] = useState(1);
  const formatData = useMemo(() => {
    return data.map((d, index) => {
      return {
        no: index + 1,
        item: d.user_type,
        radix: 1,
        value: d.percent,
        unit: "%",
      };
    });
  }, [data]);
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return formatData.slice(startIndex, endIndex);
  }, [formatData, page]);
  return (
    <>
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="font-semibold leading-none tracking-tight">
          타깃독자 분석상세
        </div>
      </div>
      <div className="p-6 pt-0 flex flex-col gap-4">
        <AnalysisDataTable data={paginatedData} />
        <PaginationPrevNextControls
          page={page}
          setPage={setPage}
          totalPages={calculatePageCount(data.length, ITEMS_PER_PAGE)}
        />
      </div>
    </>
  );
}
