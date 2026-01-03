"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import {
  useDeleteProfile,
  useEditAdminRight,
  useGetUserDetail,
  useResetPassword,
  useSignOff,
} from "@/api/user";
import { format } from "date-fns";
import { roleType } from "@/enums/roleType";
import { useEffect, useState } from "react";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import FullPageLoader from "@/components/common/FullPageLoader";
import { useQueryClient } from "@tanstack/react-query";

export default function Page() {
  // const isMobile = useIsMobile()
  const router = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname.split("/");
  const userId = pathSegments[pathSegments.length - 1];
  const [password, setPassword] = useState("");
  const [adminRight, setAdminRight] = useState(false);
  const queryClient = useQueryClient();

  const resetPassword = useResetPassword();
  const editAdminRight = useEditAdminRight();
  const deleteProfile = useDeleteProfile();
  const signOff = useSignOff();
  const { data, refetch, isLoading, isFetching } = useGetUserDetail(
    userId || ""
  );
  const profileList = data && data?.profiles.length > 0 ? data?.profiles : [];

  useEffect(() => {
    if (data) {
      setAdminRight(data?.role_type === "admin");
    }
  }, [data]);

  const handleUpdate = async () => {
    if (resetPassword.isPending || editAdminRight.isPending) {
      return;
    }
    try {
      let updated = false;
      if (password) {
        await resetPassword.mutateAsync({
          id: userId,
          body: { password: password },
        });
        updated = true;
      } else if (adminRight !== (data?.role_type === "admin")) {
        await editAdminRight.mutateAsync({
          id: userId,
          body: { role_type: adminRight ? "admin" : "normal" },
        });
        updated = true;
      } else {
        router.push("/users");
      }
      if (updated) {
        // Invalidate cache to ensure fresh data on next visit
        queryClient.invalidateQueries({ queryKey: ["GetUserDetail", userId] });
        queryClient.invalidateQueries({ queryKey: ["GetUser"] });
        router.push("/users");
      }
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteProfile.isPending) {
      return;
    }
    const result = await confirm({
      title: "프로필을 삭제하시겠습니까?",
      text: "삭제 후 복구할 수 없습니다.",
      confirm: "삭제",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    deleteProfile.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handleWithdraw = async () => {
    if (signOff.isPending) {
      return;
    }
    const result = await confirm({
      title: "회원 탈퇴하시겠습니까?",
      text: "탈퇴 후 회원님의 모든 데이터는 복구할 수 없습니다.",
      confirm: "탈퇴",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    signOff.mutate(userId, {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handleCancel = () => {
    router.push("/users");
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="회원 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>회원 관리</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    취소
                  </Button>
                  <Button onClick={handleUpdate}>수정</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <hr />
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHead className="require">대표 닉네임</TableHead>
                    <TableCell>{data?.nickname || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">이메일</TableHead>
                    <TableCell>{data?.email || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">이름</TableHead>
                    <TableCell>{data?.user_name || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">휴대전화</TableHead>
                    <TableCell>{data?.phone || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">가입일</TableHead>
                    <TableCell>
                      {data?.created_date
                        ? format(new Date(data?.created_date), "yyyy-MM-dd")
                        : ""}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">이용약관</TableHead>
                    <TableCell>
                      {data?.agree_terms_yn === "Y" ? "동의함" : "동의 안함"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">광고성 정보 수신</TableHead>
                    <TableCell>
                      {data?.notifications_status?.marketing_yn === "Y" ? "동의함" : "동의 안함"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">비밀번호 변경</TableHead>
                    <TableCell>
                      <Input
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <em className="caution">
                        주의 : 입력 시 비밀번호가 강제 변경됩니다.
                      </em>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">관리자 권한</TableHead>
                    <TableCell>
                      <Input
                        type="checkbox"
                        className="w-[36px]"
                        checked={adminRight}
                        onChange={(e) => setAdminRight(e.target.checked)}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="destructive" onClick={handleWithdraw}>
                회원 탈퇴
              </Button>
            </CardFooter>
          </Card>
          {profileList.map((item, index) => (
            <Card key={`card-${index}`}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  프로필{index + 1}
                  {index > 0 && (
                    <Button onClick={() => handleDelete(item.profile_id + "")}>
                      프로필 삭제
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableHead className="require">닉네임</TableHead>
                      <TableCell>{item.nickname}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead className="require">권한</TableHead>
                      <TableCell>
                        {item.role_type ? roleType[item.role_type] : ""}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead className="require">대표 여부</TableHead>
                      <TableCell>
                        {item?.default_yn === "Y" ? "o" : "x"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
        <FullPageLoader
          isLoading={
            isLoading ||
            isFetching ||
            deleteProfile.isPending ||
            editAdminRight.isPending ||
            resetPassword.isPending ||
            signOff.isPending
          }
        />
      </SidebarInset>
    </>
  );
}
