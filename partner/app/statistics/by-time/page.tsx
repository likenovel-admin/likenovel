"use client";
import {
  getDownloadHourlyInflows,
  useGetHourlyInflows,
} from "@/api/hourly-inflow";
import { IGetHourlyInflowParams } from "@/api/hourly-inflow/dto";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchText } from "@/components/common/SearchText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";

import { SidebarInset } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { item_per_page } from "@/constants/common";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { IHourlyInflow } from "@/types/hourly-inflow";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetHourlyInflowParams>({
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
  } = useGetHourlyInflows({
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
      apiFn: getDownloadHourlyInflows,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
      },
      headers: [],
      fields: [
        (_: IHourlyInflow) => "시간별 유입 분석",
        (row: IHourlyInflow) => row.title,
      ],
      filename: "시간별 유입 분석",
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

  const handleOnSearch = (filters: IGetHourlyInflowParams) => {
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
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader
          title="시간별 유입 분석"
          parent="통계 분석"
          child="시간별 유입 분석"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchText
              options={[{ value: "product-title", label: "작품명" }]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            {/* <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button> */}
          </div>
          <Table>
            <TableBody>
              {(data?.results || []).map((item) => (
                <TableRow
                  key={`products-row-${item.product_id}`}
                  className="w-full"
                >
                  <TableCell className="max-w-[20%] w-[20%]">
                    시간별 유입 분석
                  </TableCell>
                  <TableCell>
                    <a
                      href={`/statistics/by-time/${item.product_id}?title=${item.title}`}
                    >
                      {item.title}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
      </SidebarInset>
    </>
  );
}
