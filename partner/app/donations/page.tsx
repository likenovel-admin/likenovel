"use client";
import {
  getDownloadSponsorshipRecodes,
  useGetSponsorshipRecodes,
} from "@/api/sponsorship-recodes";
import { IGetSponsorshipRecodeParams } from "@/api/sponsorship-recodes/dto";
import SponsorShipsTable from "@/app/donations/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchDateNText } from "@/components/common/SearchDateNText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { sponsorshipSettlementStatus } from "@/constants/sponsorship";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { ISponsorshipRecode } from "@/types/sponsorship-recodes";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetSponsorshipRecodeParams>({
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
  } = useGetSponsorshipRecodes({
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
    search_start_date: filters.search_start_date
      ? format(filters.search_start_date, "yyyy-MM-dd")
      : undefined,
    search_end_date: filters.search_end_date
      ? format(filters.search_end_date, "yyyy-MM-dd")
      : undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getDownloadSponsorshipRecodes,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
        search_start_date: filters.search_start_date
          ? format(filters.search_start_date, "yyyy-MM-dd")
          : undefined,
        search_end_date: filters.search_end_date
          ? format(filters.search_end_date, "yyyy-MM-dd")
          : undefined,
      },
      headers: [
        "Date",
        "작품명",
        "작품ID",
        "작가명",
        "후원자",
        "후원금액",
        "정산여부",
      ],
      fields: [
        (row: ISponsorshipRecode) =>
          row.created_date
            ? format(new Date(row.created_date), "yyyy.MM.dd")
            : "-",
        "title",
        "product_id",
        "author_nickname",
        "user_name",
        "donation_price",
        (row: ISponsorshipRecode) =>
          row?.settlement_status
            ? sponsorshipSettlementStatus[row.settlement_status]
            : "",
      ],
      filename: "후원 내역",
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

  const handleOnSearch = (filters: IGetSponsorshipRecodeParams) => {
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
          title="후원 내역"
          parent="후원 및 기타 수익"
          child="후원 내역"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchDateNText
              options={[
                { value: "product-title", label: "작품명" },
                { value: "product-id", label: "작품ID" },
                { value: "author-name", label: "작가명" },
                { value: "sponsor-name", label: "후원자" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button>
          </div>
          <SponsorShipsTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => refetch()}
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
      </SidebarInset>
    </>
  );
}
