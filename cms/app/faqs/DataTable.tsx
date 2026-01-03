"use client";

import { useDeleteFaq } from "@/api/faq";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import {
  catchErrorMessage,
  confirm,
  formatDateRange,
  showAlert,
} from "@/lib/utils";
import { IFaq } from "@/types/faq";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Props {
  data: IFaq[];
  loading?: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  refetch: () => void;
}

export default function FaqsTable({
  data,
  loading,
  currentPage,
  pageSize,
  totalCount,
  refetch,
}: Props) {
  const router = useRouter();
  const deleteFaq = useDeleteFaq();

  const handleDelete = async (id: string) => {
    if (deleteFaq.isPending) {
      return;
    }
    const result = await confirm({
      title: "FAQ를 삭제하시겠습니까?",
      text: "삭제 후 복구할 수 없습니다.",
      confirm: "삭제",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    deleteFaq.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handleEdit = (id: string) => {
    router.push(`/faqs/${id}`);
  };

  const columns: Column[] = [
    {
      header: "No",
      key: "position",
      render: (_: unknown, __: IFaq, index?: number) =>
        totalCount - (currentPage - 1) * pageSize - (index || 0),
    },
    { header: "제목", key: "subject" },
    {
      header: "작성일",
      key: "date",
      render: (_, row: IFaq) =>
        row.created_date ? format(row.created_date, "yyyy-MM-dd HH:mm:ss") : "",
    },
    {
      header: "조회수",
      key: "view_count",
    },
    {
      header: "관리",
      key: "actions",
      render: (_, row: IFaq) => (
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
      <FullPageLoader isLoading={deleteFaq.isPending} />
    </>
  );
}
