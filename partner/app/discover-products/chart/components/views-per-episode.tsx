import AnalysisDataTable from "@/app/discover-products/chart/components/analysis-data-table";
import { PaginationPrevNextControls } from "@/components/common/PaginationControls";
import { calculatePageCount } from "@/lib/utils";
import { EpisodeCountHit } from "@/types/product-discovery-statistics";
import { useMemo, useState } from "react";

const ITEMS_PER_PAGE = 5;
const ViewsPerEpisode = ({ data }: { data: EpisodeCountHit[] }) => {
  const [page, setPage] = useState(1);
  const formatEpisodeCountHit = useMemo(() => {
    return (data || []).map((d) => {
      return {
        no: d.episode_no,
        item: d.episode_title,
        value: d.count_hit,
        unit: "View",
      };
    });
  }, [data]);
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return formatEpisodeCountHit.slice(startIndex, endIndex);
  }, [formatEpisodeCountHit, page]);
  const sumEpisodeCountHit = useMemo(() => {
    return data.reduce((acc, cur) => acc + cur.count_hit, 0);
  }, [data]);

  return (
    <>
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="font-semibold leading-none tracking-tight">
          회차별 조회수
        </div>
        <div className="text-sm text-muted-foreground font-medium leading-none tracking-tight">
          조회수{" "}
          <span className="text-lg text-foreground">{sumEpisodeCountHit}</span>{" "}
          View
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
};

export default ViewsPerEpisode;
