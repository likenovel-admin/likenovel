"use client";

import { usePostAdminDirectGift } from "@/api/userGiftBook";
import FullPageLoader from "@/components/common/FullPageLoader";
import MultiUserSearch from "@/components/common/MultiUserSearch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { IUser } from "@/types/user";
import { X } from "lucide-react";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";

export default function GiftByUser() {
  const postGift = usePostAdminDirectGift();
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [reason, setReason] = useState<string>("관리자 직접 지급");
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    undefined
  );
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);

  const handleSubmit = async () => {
    if (postGift.isPending) return;

    if (selectedUsers.length === 0) {
      showAlert("알림", "유저를 선택해주세요.", "확인");
      return;
    }
    if (ticketCount < 1) {
      showAlert("알림", "대여권 수를 1개 이상 입력해주세요.", "확인");
      return;
    }
    if (!reason.trim()) {
      showAlert("알림", "지급 사유를 입력해주세요.", "확인");
      return;
    }
    if (!expirationDate) {
      showAlert("알림", "만료일을 선택해주세요.", "확인");
      return;
    }

    postGift.mutate(
      {
        user_ids: selectedUsers.map((u) => u.user_id),
        amount: ticketCount,
        reason: reason.trim(),
        expiration_date: expirationDate.toISOString().split("T")[0],
      },
      {
        onSuccess: (data) => {
          showAlert(
            "완료",
            `${data.result.created_count}명에게 대여권이 지급되었습니다.`,
            "확인"
          );
          setSelectedUsers([]);
          setTicketCount(1);
          setReason("관리자 직접 지급");
          setExpirationDate(undefined);
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>유저별 대여권 지급</span>
            <Button onClick={handleSubmit} disabled={postGift.isPending}>
              지급
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table classNameWrap="static">
            <TableBody>
              <TableRow>
                <TableHead className="w-[160px] require">대여권 수</TableHead>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={ticketCount}
                    onChange={(e) =>
                      setTicketCount(Math.max(1, Number(e.target.value)))
                    }
                    className="w-[120px]"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">지급 사유</TableHead>
                <TableCell>
                  <Input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-[300px]"
                    placeholder="지급 사유를 입력하세요"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">만료일</TableHead>
                <TableCell>
                  <ReactDatePicker
                    selected={expirationDate}
                    onChange={(date) => setExpirationDate(date ?? undefined)}
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()}
                    placeholderText="만료일"
                    className="border px-3 py-2 rounded text-sm w-[140px]"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">유저 검색</TableHead>
                <TableCell>
                  <MultiUserSearch
                    selectedUsers={selectedUsers}
                    setSelectedUsers={setSelectedUsers}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {selectedUsers.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                선택된 유저 ({selectedUsers.length}명)
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>닉네임</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead className="w-[60px]">삭제</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.user_id}</TableCell>
                      <TableCell>{user.nickname || user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUsers((prev) =>
                              prev.filter((u) => u.user_id !== user.user_id)
                            )
                          }
                          className="hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <FullPageLoader isLoading={postGift.isPending} />
    </>
  );
}
