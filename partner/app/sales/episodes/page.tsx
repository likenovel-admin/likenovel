"use client";
import { getDownloadProducts, useGetProducts } from "@/api/product";
import {
  getDownloadSaleByEpisodes,
  useGetSaleByEpisodes,
} from "@/api/sales-by-episode";
import { IGetSaleByEpisodeParams } from "@/api/sales-by-episode/dto";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchDateNText } from "@/components/common/SearchDateNText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { item_per_page } from "@/constants/common";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { ISaleByEpisode } from "@/types/sales-by-episode";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetSaleByEpisodeParams>({
    page: 1,
    count_per_page: item_per_page,
    search_start_date: "",
    search_end_date: "",
    search_target: "",
    search_word: "",
  });

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetProducts({
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
    start_date: filters.search_start_date
      ? format(filters.search_start_date, "yyyy-MM-dd")
      : undefined,
    end_date: filters.search_end_date
      ? format(filters.search_end_date, "yyyy-MM-dd")
      : undefined,
    from_episode_sales_page: 1,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getDownloadProducts,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
        start_date: filters.search_start_date
          ? format(filters.search_start_date, "yyyy-MM-dd")
          : undefined,
        end_date: filters.search_end_date
          ? format(filters.search_end_date, "yyyy-MM-dd")
          : undefined,
        from_episode_sales_page: 1,
      },
      headers: [],
      fields: [
        (_: ISaleByEpisode) => "회차별 매출",
        (row: ISaleByEpisode) => row.title,
      ],
      filename: "회차별 매출",
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

  const handleOnSearch = (filters: IGetSaleByEpisodeParams) => {
    setFilers(filters);
  };
  const handleOnReset = () => {
    setFilers({
      page: 1,
      count_per_page: item_per_page,
      search_target: "",
      search_word: "",
      search_start_date: "",
      search_end_date: "",
    });
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader
          title="회차별 매출"
          parent="매출 및 정산"
          child="회차별 매출"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchDateNText
              options={[
                { value: "product-title", label: "작품명" },
                // { value: "product-id", label: "작품ID" },
                // { value: "author-name", label: "작가명" },
                // { value: "cp-name", label: "CP명" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button>
          </div>
          <Table>
            <TableBody>
              {(data?.results || []).map((item) => (
                <TableRow
                  key={`products-row-${item.product_id}`}
                  className="w-full"
                >
                  <TableCell className="max-w-[20%] w-[20%]">
                    회차별 매출
                  </TableCell>
                  <TableCell>
                    <a href={`/sales/episodes/${item.product_id}`}>
                      {item.title}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {(!data?.results || data?.results.length === 0) && (
                <div className="px-4 py-2 text-center text-sm text-muted-foreground flex items-center justify-center h-24">
                  No data
                </div>
              )}
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
