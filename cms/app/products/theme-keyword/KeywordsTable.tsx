"use client";

import { useDeleteKeyword } from "@/api/keyword";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { IKeyword } from "@/types/keyword";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Props {
  data: IKeyword[];
  loading?: boolean;
  handleOpenKeywordPopup: (data: IKeyword | null) => void;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  refetch: () => void;
}

export default function KeywordsTable({
  data,
  loading,
  currentPage,
  pageSize,
  totalCount,
  refetch,
  handleOpenKeywordPopup,
}: Props) {
  const route = useRouter();
  const deleteKeyword = useDeleteKeyword();

  const handleDelete = async (id: string) => {
    if (deleteKeyword.isPending) {
      return;
    }
    const result = await confirm({
      title: "프로필을 삭제하시겠습니까?",
      text: "삭제 후 복구할 수 없습니다.",
      confirm: "삭제",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    deleteKeyword.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const columns: Column[] = [
    {
      header: "No",
      key: "no",
      render: (_: unknown, __: IKeyword, index?: number) =>
        totalCount - (currentPage - 1) * pageSize - (index || 0),
    },
    { header: "태그 종류", key: "category_code" },
    { header: "태그명", key: "keyword_name" },
    { header: "사용수", key: "use_count" },
    {
      header: "등록일",
      key: "created_at",
      render: (_, row: IKeyword) =>
        row?.created_date
          ? format(new Date(row.created_date), "yyyy-MM-dd")
          : "",
    },
    {
      header: "관리",
      key: "actions",
      render: (_, row: IKeyword) => (
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={() => handleOpenKeywordPopup(row)}>
            관리
          </Button>
          <Button
            variant="outline"
            onClick={() => handleDelete(row.keyword_id + "")}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ];
  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
      <FullPageLoader isLoading={deleteKeyword.isPending} />
    </>
  );
}
