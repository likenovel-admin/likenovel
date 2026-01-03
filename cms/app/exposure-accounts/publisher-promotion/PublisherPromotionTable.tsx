"use client";

import { useDeletePublisherPromotion } from "@/api/publisherPromotion";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { IPublisherPromotionInList } from "@/types/publisherPromotion";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Props {
  data: IPublisherPromotionInList[];
  loading?: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  refetch: () => void;
}

export default function PublisherPromotionTable({
  data,
  loading,
  currentPage,
  pageSize,
  totalCount,
  refetch,
}: Props) {
  const route = useRouter();
  const deletePublisherPromotion = useDeletePublisherPromotion();

  const handleEdit = (row: IPublisherPromotionInList) => {
    route.push(`/exposure-accounts/publisher-promotion/${row.id}`);
  };

  const handleDelete = async (id: string) => {
    if (deletePublisherPromotion.isPending) {
      return;
    }
    const result = await confirm({
      title: "프로필을 삭제하시겠습니까?",
      text: "삭제 후 복구할 수 없습니다.",
      confirm: "삭제",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    deletePublisherPromotion.mutate(id, {
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
      header: "노출 순서",
      key: "show_order",
    },
    {
      header: "작품명",
      key: "title",
    },
    {
      header: "작품 ID",
      key: "product_id",
    },
    {
      header: "작가명",
      key: "author_name",
    },
    {
      header: "담당 CP",
      key: "cp_company_name",
    },
    {
      header: "추가일",
      key: "created_at",
      render: (_, row: IPublisherPromotionInList) =>
        row?.created_date
          ? format(new Date(row.created_date), "yyyy-MM-dd")
          : "",
    },
    {
      header: "관리",
      key: "actions",
      render: (_, row: IPublisherPromotionInList) => (
        <div className="flex gap-2 items-center">
          <Button variant="outline" onClick={() => handleEdit(row)}>
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
      <FullPageLoader isLoading={deletePublisherPromotion.isPending} />
    </>
  );
}
