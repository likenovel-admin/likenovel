"use client";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import { SearchText } from "@/components/common/SearchText";
import { IGetUserParams } from "@/api/user/dto";
import { item_per_page } from "@/constants/common";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { downloadExcel } from "@/lib/excelDownload";
import { getUserDownload, useGetUser } from "@/api/user";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import UsersTable from "@/app/users/UsersTable";
import { IUser } from "@/types/user";

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "all";
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetUserParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
  });

  const tabs = [
    {
      label: "전체",
      value: "all",
    },
    {
      label: "일반",
      value: "normal",
    },
    {
      label: "관리자",
      value: "admin",
    },
    {
      label: "탈퇴",
      value: "signout",
    },
  ];

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetUser({
    page: filters.page,
    count_per_page: filters.count_per_page,
    status: tab || undefined,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleDownloadExcel = async () => {
    const isSignout = tab === "signout";

    const headers = isSignout
      ? [
          "User_ID",
          "이메일",
          "가입일",
          "최근 접속일",
          "탈퇴일",
          "이용약관",
          "광고성 정보 수신",
        ]
      : [
          "User_ID",
          "이메일",
          "이름",
          "닉네임",
          "연락처",
          "가입일",
          "최근 접속일",
        ];

    const fields = isSignout
      ? [
          "user_id",
          "email",
          "created_date",
          "latest_signed_date",
          "signoff_date",
          (row: any) => (row?.agree_terms_yn === "Y" ? "동의함" : "동의 안함"),
          (row: any) => (row?.noti_yn === "Y" ? "동의함" : "동의 안함"),
        ]
      : [
          "user_id",
          "email",
          "name",
          "nickname",
          "phone",
          "created_date",
          "latest_signed_date",
        ];
    await downloadExcel({
      apiFn: getUserDownload,
      params: {
        status: tab || undefined,
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
      },
      headers,
      fields,
      filename: "회원 목록",
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

  const handleOnSearch = (filters: IGetUserParams) => {
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
        <PageHeader title="회원 목록" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4">
            {tabs.map((item, index) => (
              <Button
                key={`tab-${index}`}
                variant={tab == item.value ? "default" : "outline"}
                onClick={() => {
                  route.push(`/users?tab=${item.value}`);
                  handleOnReset();
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchText
              options={
                tab === "signout"
                  ? [{ value: "email", label: "이메일" }]
                  : [
                      { value: "nickname", label: "닉네임" },
                      { value: "name", label: "이름" },
                      { value: "contact", label: "연락처" },
                      { value: "email", label: "이메일" },
                    ]
              }
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button>
          </div>
          <UsersTable
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
