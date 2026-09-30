"use client";

import { useDeleteNotice, useGetLiveNoticeTopBar } from "@/api/notice";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import { INotice } from "@/types/notice";
import { format } from "date-fns";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  describeNoticeTopBarPeriod,
  resolveNoticeTopBarStatus,
  type NoticeTopBarStatus,
} from "./noticeTopBar";

const TOP_BAR_STATUS_STYLE: Record<NoticeTopBarStatus, { className: string; hint: string }> = {
  "노출 중": { className: "font-semibold text-blue-600", hint: "지금 사이트 맨 위에 보이는 띠입니다." },
  예약: { className: "text-amber-600", hint: "시작 시각이 되면 자동으로 보입니다." },
  대기: { className: "text-muted-foreground", hint: "더 늦게 시작한 다른 띠가 보이는 중입니다. 그 띠가 끝나면 이어서 보입니다." },
  종료: { className: "text-muted-foreground", hint: "종료 시각이 지나 더 이상 보이지 않습니다." },
};

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
  const liveTopBar = useGetLiveNoticeTopBar();
  const liveNoticeId = liveTopBar.isSuccess
    ? liveTopBar.data?.data?.noticeId ?? null
    : undefined;

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
      header: "상단 띠",
      key: "top_bar_yn",
      render: (_, row: INotice) => {
        if (row.top_bar_yn !== "Y") return "";
        const status = resolveNoticeTopBarStatus(row, liveNoticeId, Date.now());
        return (
          <div className="flex flex-col text-xs" title={row.top_bar_text || ""}>
            {status ? (
              <span
                className={TOP_BAR_STATUS_STYLE[status].className}
                title={TOP_BAR_STATUS_STYLE[status].hint}
              >
                {status}
              </span>
            ) : null}
            <span className="text-muted-foreground tabular-nums">
              {describeNoticeTopBarPeriod(row)}
            </span>
          </div>
        );
      },
    },
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
