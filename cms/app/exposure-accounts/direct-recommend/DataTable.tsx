"use client";

import { useDeleteDirectRecommend } from "@/api/directRecommend";
import { useDeleteKeyword } from "@/api/keyword";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import {
  catchErrorMessage,
  confirm,
  formatDateRange,
  showAlert,
} from "@/lib/utils";
import { IDirectRecommend } from "@/types/directRecommend";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

interface Props {
  data: IDirectRecommend[];
  loading?: boolean;
  refetch: () => void;
}

export default function DirectRecommendTable({
  data,
  loading,
  refetch,
}: Props) {
  const route = useRouter();
  const deleteDirectRecommend = useDeleteDirectRecommend();

  const handleDelete = async (id: string) => {
    if (deleteDirectRecommend.isPending) {
      return;
    }
    const result = await confirm({
      title: "추천구좌를 삭제하시겠습니까?",
      text: "삭제 후 복구할 수 없습니다.",
      confirm: "삭제",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    deleteDirectRecommend.mutate(id, {
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
      header: "추천구좌명",
      key: "name",
    },
    { header: "노출 순서", key: "order" },
    { header: "작품 리스트", key: "product_ids" },
    {
      header: "노출기간",
      key: "date",
      render: (_, row: IDirectRecommend) =>
        formatDateRange(row.exposure_start_date, row.exposure_end_date),
    },
    {
      header: "관리",
      key: "actions",
      render: (_, row: IDirectRecommend) => (
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            onClick={() =>
              route.push("/exposure-accounts/direct-recommend/" + row.id)
            }
          >
            관리
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
      <FullPageLoader isLoading={deleteDirectRecommend.isPending} />
    </>
  );
}
