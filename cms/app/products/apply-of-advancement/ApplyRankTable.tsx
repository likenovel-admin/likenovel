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

const DEFAULT_PAID_EPISODE_NO = 26;
const DEFAULT_WAITING_FOR_FREE_PERIOD_MONTHS = 12;
const WAITING_FOR_FREE_PERIOD_OPTIONS = [
  { label: "3개월", value: 3 },
  { label: "6개월", value: 6 },
  { label: "1년", value: 12 },
  { label: "3년", value: 36 },
];

interface PaidConversionModalValue {
  paidEpisodeNo: number;
  waitingForFreeEnabled: boolean;
  waitingForFreePeriodMonths: number;
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
    const defaultPaidEpisodeNo =
      row.paid_episode_no && row.paid_episode_no > 0
        ? row.paid_episode_no
        : Math.min(DEFAULT_PAID_EPISODE_NO, maxPaidEpisodeNo);

    const result = await Swal.fire({
      title: "유료 전환 적용",
      html: `
        <label for="paidEpisodeNo">유료 시작 회차</label>
        <input id="paidEpisodeNo" class="swal2-input" type="number"
          min="1" max="${maxPaidEpisodeNo}" step="1" value="${defaultPaidEpisodeNo}" />
        <label style="display:flex;align-items:center;justify-content:center;gap:8px;margin:16px 0 8px">
          <input id="waitingForFreeEnabled" type="checkbox" checked />
          기다무 적용
        </label>
        <select id="waitingForFreePeriodMonths" class="swal2-select">
          ${WAITING_FOR_FREE_PERIOD_OPTIONS.map(
            ({ label, value }) =>
              `<option value="${value}" ${
                value === DEFAULT_WAITING_FOR_FREE_PERIOD_MONTHS
                  ? "selected"
                  : ""
              }>${label}</option>`
          ).join("")}
        </select>
        <p style="font-size:12px;color:#6b7280;margin-top:8px">
          24시간 구좌 편성은 별도 수동 반영입니다.
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: "적용",
      cancelButtonText: "취소",
      buttonsStyling: false,
      customClass: {
        popup: "styled-swal-popup",
        confirmButton: "swal-confirm-btn",
        cancelButton: "swal-cancel-btn",
      },
      focusConfirm: false,
      preConfirm: () => {
        const popup = Swal.getPopup();
        const paidEpisodeNo = Number(
          popup?.querySelector<HTMLInputElement>("#paidEpisodeNo")?.value
        );
        const waitingForFreeEnabled =
          popup?.querySelector<HTMLInputElement>("#waitingForFreeEnabled")
            ?.checked ?? true;
        const waitingForFreePeriodMonths = Number(
          popup?.querySelector<HTMLSelectElement>(
            "#waitingForFreePeriodMonths"
          )?.value ?? DEFAULT_WAITING_FOR_FREE_PERIOD_MONTHS
        );
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
        return {
          paidEpisodeNo,
          waitingForFreeEnabled,
          waitingForFreePeriodMonths,
        };
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

        const toggle = document.getElementById(
          "waitingForFreeEnabled"
        ) as HTMLInputElement | null;
        const period = document.getElementById(
          "waitingForFreePeriodMonths"
        ) as HTMLSelectElement | null;
        const syncPeriod = () => {
          if (toggle && period) period.disabled = !toggle.checked;
        };
        toggle?.addEventListener("change", syncPeriod);
        syncPeriod();
      },
    });

    if (!result.isConfirmed || !result.value) return;
    const options = result.value as PaidConversionModalValue;

    applyPaidConversion.mutate(
      {
        id: row.apply_id + "",
        paidEpisodeNo: options.paidEpisodeNo,
        waitingForFreeEnabled: options.waitingForFreeEnabled,
        waitingForFreePeriodMonths: options.waitingForFreePeriodMonths,
      },
      {
        onSuccess: (response) => {
          const waitFreeMessage = response.data.waitingForFreeEnabled
            ? `기다무는 약 ${response.data.waitingForFreeActivationDelayMinutes}분 뒤 활성화됩니다. 24시간 구좌는 별도 수동 반영입니다.`
            : "";
          showAlert(
            "완료",
            ["유료 전환 설정이 적용되었습니다.", waitFreeMessage]
              .filter(Boolean)
              .join("\n"),
            "확인"
          );
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
      key: "req_apply_date",
      render: (_, row: IApplyRank) =>
        row?.req_apply_date
          ? format(new Date(row.req_apply_date), "yyyy-MM-dd")
          : "",
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
