"use client";
import {
  getReviewCommentNoticeDownload,
  useGetReviewCommentNotice,
} from "@/api/reviewCommentNotice";
import { IGetReviewCommentNoticeParams } from "@/api/reviewCommentNotice/dto";
import DataTable, {
  DataType,
  isComment,
  isNotice,
  isReview,
} from "@/app/products/review-comment-notice/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchDateNText } from "@/components/common/SearchDateNText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { item_per_page } from "@/constants/common";
import { downloadExcel } from "@/lib/excelDownload";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "all";
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetReviewCommentNoticeParams>({
    page: 1,
    count_per_page: item_per_page,
    start_date: undefined,
    end_date: undefined,
    search_target: "",
    search_word: "",
    type: "",
  });

  const tabs = [
    {
      label: "전체",
      value: "all",
    },
    {
      label: "리뷰",
      value: "reviews",
    },
    {
      label: "댓글",
      value: "comments",
    },
    {
      label: "공지",
      value: "notices",
    },
  ];

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetReviewCommentNotice({
    type: tab || undefined,
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_start_date: filters.start_date
      ? format(filters.start_date, "yyyy-MM-dd")
      : undefined,
    search_end_date: filters.end_date
      ? format(filters.end_date, "yyyy-MM-dd")
      : undefined,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getReviewCommentNoticeDownload,
      params: {
        type: tab || undefined,
        search_search_start_date: filters.start_date
          ? format(filters.start_date, "yyyy-MM-dd")
          : undefined,
        search_search_end_date: filters.end_date
          ? format(filters.end_date, "yyyy-MM-dd")
          : undefined,
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
      },
      headers: [
        "종류",
        "작성자",
        "제목 / 내용",
        "대상 작품명",
        "작성 일자",
        "노출",
      ],
      fields: [
        (row: DataType) => {
          if (isReview(row)) return "리뷰";
          if (isComment(row)) return "댓글";
          if (isNotice(row)) return "공지";
          return "-";
        },
        (row: DataType) => `${row.user_name}`,
        (row: DataType) => {
          if (isReview(row)) return row.contents;
          if (isComment(row)) return row.contents;
          if (isNotice(row)) return `${row.contents}`;
          return "-";
        },
        (row: DataType) => `${row.product_title}`,
        (row: DataType) => {
          return `${row.created_date ? format(new Date(row.created_date), "yyyy-MM-dd") : ""}`;
        },
        (row: DataType) => {
          return `${row.open_yn === "Y" ? "공개" : "비공개"}`;
        },
      ],
      filename: "리뷰,댓글,공지 관리",
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

  const handleOnSearch = (filters: IGetReviewCommentNoticeParams) => {
    setFilers(filters);
  };
  const handleOnReset = () => {
    setFilers({
      page: 1,
      count_per_page: item_per_page,
      search_start_date: undefined,
      search_end_date: undefined,
      start_date: undefined,
      end_date: undefined,
      search_target: "",
      search_word: "",
    });
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="리뷰/댓글/공지 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4">
            {tabs.map((item, index) => (
              <Button
                key={`tab-${index}`}
                variant={tab == item.value ? "default" : "outline"}
                onClick={() => {
                  route.push(
                    `/products/review-comment-notice?tab=${item.value}`
                  );
                  handleOnReset();
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchDateNText
              options={[
                { value: "product-title", label: "작품명" },
                { value: "writer-name", label: "작성자" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button>
          </div>
          <DataTable
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

export default function SuspensePage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
