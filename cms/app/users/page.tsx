"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarInset } from "@/components/ui/sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import { SearchText } from "@/components/common/SearchText";
import { IGetUserParams } from "@/api/user/dto";
import { item_per_page } from "@/constants/common";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import { downloadExcel } from "@/lib/excelDownload";
import { getUserDownload, useCreateAccount, useGetUser } from "@/api/user";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import UsersTable from "@/app/users/UsersTable";

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "all";
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const createAccount = useCreateAccount();
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

  const handleCreateAccount = async () => {
    if (!newEmail.trim()) {
      showAlert("오류", "이메일을 입력해주세요.", "확인");
      return;
    }
    if (!newPassword.trim()) {
      showAlert("오류", "비밀번호를 입력해주세요.", "확인");
      return;
    }
    try {
      await createAccount.mutateAsync({
        email: newEmail,
        password: newPassword,
      });
      showAlert("완료", "계정이 생성되었습니다.", "확인");
      setShowCreateModal(false);
      setNewEmail("");
      setNewPassword("");
      refetch();
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
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
                      { value: "user_id", label: "유저ID" },
                      { value: "nickname", label: "닉네임" },
                      { value: "name", label: "이름" },
                      { value: "contact", label: "연락처" },
                      { value: "email", label: "이메일" },
                    ]
              }
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                임의계정 발급
              </Button>
              <Button variant="outline" onClick={handleDownloadExcel}>
                엑셀 다운로드
              </Button>
            </div>
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

      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            setNewEmail("");
            setNewPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>임의계정 발급</DialogTitle>
            <DialogDescription>
              이메일과 비밀번호를 입력하여 새 계정을 생성합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="create-email">이메일</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="이메일 주소를 입력하세요"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="create-password">비밀번호</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="8자 이상, 영문+숫자+특수문자"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleCreateAccount}
              disabled={createAccount.isPending}
            >
              {createAccount.isPending ? "생성 중..." : "확인"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
