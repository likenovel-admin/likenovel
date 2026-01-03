"use client";
import { getMessageDownload, useGetMessages } from "@/api/message";
import { IGetMessageParams } from "@/api/message/dto";
import MessageTable from "@/app/messages/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchText } from "@/components/common/SearchText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetMessageParams>({
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
  } = useGetMessages({
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleDownloadExcel = async () => {
    const headers = ["대화방 key", "전송 시간", "발송인", "수신인", "내용"];

    const fields = [
      "key",
      (row: any) =>
        row?.created_date
          ? format(row.created_date, "yyyy-MM-dd HH:mm:ss")
          : "",
      "sender_name",
      "receiver_name",
      "content",
    ];
    await downloadExcel({
      apiFn: getMessageDownload,
      params: {
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
      },
      headers,
      fields,
      filename: "메시지 내역",
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

  const handleOnSearch = (filters: IGetMessageParams) => {
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
        <PageHeader title="메시지 내역" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchText
              options={[
                { value: "key", label: "대화방key" },
                { value: "sender", label: "발송인" },
                { value: "receiver", label: "수신인" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button>
          </div>
          <MessageTable
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
      </SidebarInset>
    </>
  );
}

export default function SuspensePage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
