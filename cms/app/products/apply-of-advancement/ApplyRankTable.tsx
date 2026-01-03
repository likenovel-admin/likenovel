"use client";

import { useAcceptApplyRank, useDenyApplyRank } from "@/api/applyRank";
import CommonTable, { Column } from "@/components/common/CommonTable";
import { Button } from "@/components/ui/button";
import { applyRankType } from "@/enums/applyRank";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { IApplyRank } from "@/types/applyRank";
import { format } from "date-fns";

interface Props {
  data: IApplyRank[];
  tab?: string;
  loading?: boolean;
  refetch: () => void;
}

export default function ApplyRankTable({ data, loading, refetch }: Props) {
  const acceptApplyRank = useAcceptApplyRank();
  const denyApplyRank = useDenyApplyRank();

  const handleAccept = async (id: string) => {
    if (acceptApplyRank.isPending) return;

    const result = await confirm({
      title: "승급 신청 승인",
      text: "해당 작품의 승급 신청을 승인하시겠습니까?",
      confirm: "승인하기",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;

    acceptApplyRank.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handleDeny = async (id: string) => {
    if (denyApplyRank.isPending) return;

    const result = await confirm({
      title: "승급 신청 반려",
      text: "해당 작품의 승급 신청을 반려하시겠습니까?",
      confirm: "반려하기",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;

    denyApplyRank.mutate(id, {
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
      header: "승급 신청 종류",
      key: "applyType",
      render: (_, row: IApplyRank) =>
        row?.type ? applyRankType[row.type] : "",
    },
    {
      header: "신청 일자",
      key: "apply_date",
      render: (_, row: IApplyRank) =>
        row?.apply_date ? format(new Date(row?.apply_date), "yyyy-MM-dd") : "",
    },
    { header: "작품명", key: "title" },
    { header: "작품 ID", key: "product_id" },
    { header: "작가명", key: "authorNickname" },
    { header: "작가 ID", key: "author_id" },
    { header: "회차수", key: "count_episode" },
    {
      header: "작품등록일",
      key: "created_date",
      render: (_, row: IApplyRank) =>
        row?.created_date
          ? format(new Date(row?.created_date), "yyyy-MM-dd")
          : "",
    },
    { header: "조회수", key: "count_hit" },
    { header: "추천수", key: "count_recommend" },
    {
      header: "승급 현황",
      key: "status",
      render: (_, row: IApplyRank) => (
        <>
          {row?.status == "accepted" ? (
            "승인됨"
          ) : row?.status == "denied" ? (
            "반려됨"
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleAccept(row.apply_id + "")}
              >
                승인
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDeny(row.apply_id + "")}
              >
                반려
              </Button>
            </div>
          )}
        </>
      ),
    },
  ];

  return <CommonTable columns={columns} data={data} loading={loading} />;
}
