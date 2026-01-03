"use client";

import { useDeleteKeyword } from "@/api/keyword";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { IAppliedPromotion } from "@/types/appliedPromotion";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  useDenyAppliedPromotion,
  useEndAppliedPromotion,
} from "../../../api/appliedPromotion/index";
import {
  appliedPromotionsStatus,
  appliedPromotionsType,
} from "@/enums/appliedPromotions";

interface Props {
  data: IAppliedPromotion[];
  loading?: boolean;
  handleOpenAcceptPopup: (data: IAppliedPromotion | null) => void;
  refetch: () => void;
}

export default function AppliedPromotionTable({
  data,
  loading,
  refetch,
  handleOpenAcceptPopup,
}: Props) {
  const route = useRouter();
  const endAppliedPromotion = useEndAppliedPromotion();
  const denyAppliedPromotion = useDenyAppliedPromotion();

  const handleEnd = async (id: string) => {
    if (endAppliedPromotion.isPending) {
      return;
    }
    const result = await confirm({
      title: "프로모션을 종료하시겠습니까?",
      text: "종료 후에는 다시 활성화할 수 없습니다.",
      confirm: "종료",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    endAppliedPromotion.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handleDeny = async (id: string) => {
    if (denyAppliedPromotion.isPending) {
      return;
    }
    const result = await confirm({
      title: "신청을 반려하시겠습니까?",
      text: "반려 후에는 되돌릴 수 없습니다.",
      confirm: "반려",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    denyAppliedPromotion.mutate(id, {
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
      header: "작품 ID",
      key: "product_id",
    },
    {
      header: "작품명",
      key: "title",
    },
    {
      header: "작가명",
      key: "author_name",
    },
    {
      header: "프로모션 종류",
      key: "type",
      render: (_, row: IAppliedPromotion) =>
        row.type ? appliedPromotionsType[row.type] : "",
    },
    {
      header: "상태",
      key: "status",
      render: (_, row: IAppliedPromotion) =>
        row.status ? appliedPromotionsStatus[row.status] : "",
    },
    {
      header: "신청일",

      key: "created_date",
      render: (_, row: IAppliedPromotion) =>
        row.created_date ? format(row.created_date, "yyyy-MM-dd") : "",
    },
    {
      header: "시작일",
      key: "start_date",
      render: (_, row: IAppliedPromotion) =>
        row.start_date ? format(row.start_date, "yyyy-MM-dd") : "",
    },
    {
      header: "종료일",
      key: "end_date",
      render: (_, row: IAppliedPromotion) =>
        row.end_date ? format(row.end_date, "yyyy-MM-dd") : "",
    },
    {
      header: "관리",
      key: "actions",
      render: (_, row: IAppliedPromotion) => (
        <div className="flex gap-2 items-center">
          {row?.status === "ing" ? (
            <>
              <Button variant="outline" onClick={() => handleEnd(row.id + "")}>
                종료하기
              </Button>
            </>
          ) : row?.status === "deny" ? (
            <>반려됨</>
          ) : row?.status === "cancel" ? (
            <>철회됨</>
          ) : row?.status === "end" ? (
            <>종료</>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleOpenAcceptPopup(row)}
              >
                승인
              </Button>
              <Button variant="outline" onClick={() => handleDeny(row.id + "")}>
                반려
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
      <FullPageLoader
        isLoading={
          denyAppliedPromotion.isPending || endAppliedPromotion.isPending
        }
      />
    </>
  );
}
