"use client";

import { useDeleteNotice } from "@/api/notice";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { INotice } from "@/types/notice";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  data: INotice[];
  loading?: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  refetch: () => void;
}

export default function NoticesTable({
  data,
  loading,
  currentPage,
  pageSize,
  totalCount,
  refetch,
}: Props) {
  const router = useRouter();
  const deleteNotice = useDeleteNotice();

  const handleDelete = async (id: string) => {
    if (deleteNotice.isPending) {
      return;
    }
    const result = await confirm({
      title: "공지사항을 삭제하시겠습니까?",
      text: "삭제 후에는 복구할 수 없습니다.",
      confirm: "삭제",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    deleteNotice.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handleEdit = (id: string) => {
    router.push(`/notices/${id}`);
  };

  const columns: Column[] = [
    {
      header: "No",
      key: "no",
      render: (_: unknown, __: INotice, index?: number) =>
        totalCount - (currentPage - 1) * pageSize - (index || 0),
    },
    {
      header: "고정 여부",
      key: "primary_yn",
      render: (_, row: INotice) => (row.primary_yn === "Y" ? <Check /> : ""),
    },
    { header: "제목", key: "subject" },
    {
      header: "조회수",
      key: "views",
    },
    {
      header: "작성일",
      key: "date",
      render: (_, row: INotice) =>
        row.created_date ? format(row.created_date, "yyyy-MM-dd HH:mm:ss") : "",
    },
    {
      header: "관리",
      key: "actions",
      render: (_, row: INotice) => (
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={() => handleEdit(row.id + "")}>
            수정
          </Button>
          <Button variant="outline" onClick={() => handleDelete(row.id + "")}>
            삭제
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
      <FullPageLoader isLoading={deleteNotice.isPending} />
    </>
  );
}
