"use client";

import {
  useAcceptApplyRank,
  useApplyPaidConversion,
  useDenyApplyRank,
} from "@/api/applyRank";
import CommonTable, { Column } from "@/components/common/CommonTable";
import { Button } from "@/components/ui/button";
import { applyRankType } from "@/enums/applyRank";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { IApplyRank } from "@/types/applyRank";
import { format } from "date-fns";
import Swal from "sweetalert2";

interface Props {
  data: IApplyRank[];
  tab?: string;
  loading?: boolean;
  refetch: () => void;
}

export default function ApplyRankTable({ data, loading, refetch }: Props) {
  const acceptApplyRank = useAcceptApplyRank();
  const denyApplyRank = useDenyApplyRank();
  const applyPaidConversion = useApplyPaidConversion();

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

  const handleApplyPaidConversion = async (row: IApplyRank) => {
    if (applyPaidConversion.isPending) return;
    const maxPaidEpisodeNo = (row.count_episode ?? 0) + 1;

    const result = await Swal.fire({
      title: "유료 전환 적용",
      text: "유료 시작 회차를 입력해주세요.",
      input: "number",
      inputValue:
        row.paid_episode_no && row.paid_episode_no > 0
          ? String(row.paid_episode_no)
          : "1",
      inputAttributes: {
        min: "1",
        max: String(maxPaidEpisodeNo),
        step: "1",
      },
      showCancelButton: true,
      confirmButtonText: "적용",
      cancelButtonText: "취소",
      buttonsStyling: false,
      customClass: {
        popup: "styled-swal-popup",
        confirmButton: "swal-confirm-btn",
        cancelButton: "swal-cancel-btn",
      },
      preConfirm: (value) => {
        const paidEpisodeNo = Number(value);
        if (!Number.isInteger(paidEpisodeNo) || paidEpisodeNo <= 0) {
          Swal.showValidationMessage("유료 시작 회차는 1 이상의 정수로 입력해주세요.");
          return false;
        }
        if (paidEpisodeNo > maxPaidEpisodeNo) {
          Swal.showValidationMessage(
            `유료 시작 회차는 ${maxPaidEpisodeNo}회 이하로 입력해주세요.`
          );
          return false;
        }
        return paidEpisodeNo;
      },
      didOpen: () => {
        const style = document.createElement("style");
        style.textContent = `
          .swal-confirm-btn {
            background: #2563eb;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 0.5rem 1.5rem;
            font-weight: 600;
            margin: 0 0.5rem;
            font-size: 1rem;
          }
          .swal-cancel-btn {
            background: #e5e7eb;
            color: #374151;
            border: none;
            border-radius: 6px;
            padding: 0.5rem 1.5rem;
            font-weight: 600;
            margin: 0 0.5rem;
            font-size: 1rem;
          }
        `;
        document.head.appendChild(style);
      },
    });

    if (!result.isConfirmed || typeof result.value !== "number") return;

    applyPaidConversion.mutate(
      {
        id: row.apply_id + "",
        paidEpisodeNo: result.value,
      },
      {
        onSuccess: () => {
          showAlert("완료", "유료 전환 설정이 적용되었습니다.", "확인");
          refetch();
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
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
    { header: "CP 닉네임", key: "cp_nickname" },
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
            <div className="flex items-center gap-2">
              <span>승인됨</span>
              {row.type === "paid" &&
                row.status === "accepted" &&
                row.price_type === "free" &&
                (row.paid_episode_no == null || row.paid_episode_no <= 0) &&
                !row.paid_open_date && (
                  <Button
                    variant="outline"
                    disabled={applyPaidConversion.isPending}
                    onClick={() => handleApplyPaidConversion(row)}
                  >
                    유료 적용
                  </Button>
                )}
            </div>
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
