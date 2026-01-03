"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw, SquareChevronDown } from "lucide-react";
import ExcelIcon from "@/public/excel-icon.svg";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getDownloadProductDiscoveryStatisticss,
  useGetProductDiscoveryStatistics,
} from "../../api/product-discovery-statistics/index";
import { item_per_page } from "@/constants/common";
import PageHeader from "@/components/ui/page-header";
import DiscoverProductsTable from "@/app/discover-products/DataTable";
import { SearchText } from "@/components/common/SearchText";
import { IGetProductDiscoveryStatisticsParams } from "@/api/product-discovery-statistics/dto";
import PaginationControls from "@/components/common/PaginationControls";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import FullPageLoader from "@/components/common/FullPageLoader";
import { IProductDiscoveryStatistics } from "@/types/product-discovery-statistics";
import { format } from "date-fns";
import { downloadExcel } from "@/lib/excelDownload";

interface Product {
  productId?: number;
  productType?: string;
  priceType?: string;
  image?: {
    coverImagePath?: string;
    adultDefaultcoverImagePath?: string;
  };
  title?: string;
  authorNickname?: string;
  trendindex?: {
    hasEpisodeCount?: string;
    hitCount?: string;
    readedEpisodeCount?: string;
    bookmarkCount?: string;
    unbookmarkCount?: string;
    recommendCount?: string;
    evaluatedCount?: string;
    cpHitCount?: string;
    readThroughRate?: string;
    averageWritedCountByWeek?: string;
    interestSustainCount?: string;
    interestLossCount?: string;
    primaryReaderGroup?: string;
    secondaryReaderGroup?: string;
  };
  genre?: string[];
  cpEvaluation1?: string;
  cpEvaluation2?: string;
  cpEvaluation3?: string;
  synopsis?: string;
  illustratorNickname?: string;
  adultYn?: string;
  keywords?: string[];
  properties?: {
    updateFrequency?: string;
    averageWeeklyEpisodes?: number;
    remarkContentSnippet?: string;
    latestEpisodeDate?: string;
  };
  state?: {
    ongoingState?: string;
    convertToPaidState?: string;
  };
  createdDate?: string;
  updatedDate?: string;
  authorId?: number;
}

const DiscoverProductsPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetProductDiscoveryStatisticsParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
  });

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetProductDiscoveryStatistics({
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getDownloadProductDiscoveryStatisticss,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
      },
      headers: [
        "작품명",
        "작가명",
        "장르",
        "연독률",
        "주요",
        "독자수",
        "등록일",
        "주요타겟",
        "등록일 ",
      ],
      fields: [
        "title",
        "author_nickname",
        "primary_genre",
        (row: IProductDiscoveryStatistics) => `${row.reading_rate}%`,
        (row: IProductDiscoveryStatistics) => row.score1.toString(),
        "count_read_user",
        (row: IProductDiscoveryStatistics) =>
          row.created_date
            ? format(new Date(row.created_date), "yyyy.MM.dd")
            : "-",
        "primary_reader_group1",
        (row: IProductDiscoveryStatistics) =>
          row.updated_date
            ? format(new Date(row.updated_date), "yyyy.MM.dd")
            : "-",
      ],
      filename: "발굴작품 조회",
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
      onError: (error) => {
        showAlert("오류", catchErrorMessage(error), "확인");
      },
    });
  };

  const handleChangePage = (page: number) => {
    setFilers({
      ...filters,
      page,
    });
  };

  const handleOnSearch = (filters: IGetProductDiscoveryStatisticsParams) => {
    setFilers(filters);
  };
  const handleOnReset = () => {
    setFilers({
      page: 1,
      count_per_page: item_per_page,
      search_target: "",
      search_word: "",
    });
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-[#F9FAFE]">
        <PageHeader
          title="발굴작품 조회"
          parent="발굴통계"
          child="발굴작품 조회"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 md:pl-14">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-white md:min-h-min">
            <div className="m-4 flex flex-col gap-4">
              <div className="h-8 font-semibold">
                15회차 이상의 무료 연재작을 조회합니다.
              </div>
              <div className="flex items-center gap-2 px-4 justify-between">
                <SearchText
                  options={[
                    { value: "story", label: "스토리 검색" },
                    { value: "keyword-genre", label: "키워드 장르" },
                  ]}
                  onSearch={handleOnSearch}
                  onReset={handleOnReset}
                />
                <Button variant="outline" onClick={handleDownloadExcel}>
                  엑셀 다운로드
                </Button>
              </div>
              <DiscoverProductsTable
                data={data?.results ?? []}
                loading={isLoadingData || isFetching}
              />
              <PaginationControls
                page={filters.page || 1}
                setPage={handleChangePage}
                totalPages={calculatePageCount(
                  data?.total_count || 0,
                  filters.count_per_page || 8
                )}
              />
              <FullPageLoader
                isLoading={isLoading || isLoadingData || isFetching}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
};
export default DiscoverProductsPage;
