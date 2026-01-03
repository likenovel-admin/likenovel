"use client";

import {
  getDownloadEventByRecipients,
  useDeleteEvent,
  useHideEvent,
  useShowEvent,
} from "@/api/event";
import { useDeleteKeyword } from "@/api/keyword";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  eventRewardType,
  eventStatus,
  eventType,
  eventTypeAction,
} from "@/enums/event";
import { downloadFile } from "@/lib/fileDownload";
import {
  catchErrorMessage,
  confirm,
  formatDateRange,
  showAlert,
} from "@/lib/utils";
import { IEvent } from "@/types/event";
import { IKeyword } from "@/types/keyword";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  data: IEvent[];
  loading?: boolean;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  refetch: () => void;
}

export default function EventsTable({
  data,
  loading,
  currentPage,
  pageSize,
  totalCount,
  refetch,
}: Props) {
  const route = useRouter();
  const deleteEvent = useDeleteEvent();
  const onEvent = useShowEvent();
  const offEvent = useHideEvent();

  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (id: string, eventName: string) => {
    try {
      setIsLoading(true);
      const api = () => getDownloadEventByRecipients(id);

      const fileName = `${eventName} 수령인 목록`;
      await downloadFile({
        apiFunc: api,
        defaultFileName: fileName,
        onLoading: setIsLoading,
        onError: (error) => {
          showAlert("오류", catchErrorMessage(error), "확인");
        },
      });
      setIsLoading(false);
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
      setIsLoading(false);
    }
  };
  const handleOnOfEvent = (isOn: boolean, id: string) => {
    if (onEvent.isPending || offEvent.isPending) return;
    if (isOn) {
      offEvent.mutate(id, {
        onSuccess: () => {
          refetch();
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      });
    } else {
      onEvent.mutate(id, {
        onSuccess: () => {
          refetch();
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      });
    }
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (deleteEvent.isPending) {
      return;
    }
    const result = await confirm({
      title: "이벤트를 삭제하시겠습니까?",
      text: "삭제된 이벤트는 복구할 수 없습니다.",
      confirm: "삭제",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;
    deleteEvent.mutate(id, {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const handleEdit = (id: string) => {
    route.push(`/events/${id}`);
  };

  const columns: Column[] = [
    {
      header: "No",
      key: "no",
      render: (_: unknown, __: IKeyword, index?: number) =>
        totalCount - (currentPage - 1) * pageSize - (index || 0),
    },
    {
      header: "이벤트 종류",
      key: "type",
      render: (_, row: IEvent) => (row?.type ? eventType[row.type] : ""),
    },
    { header: "페이지 링크", key: "link" },
    { header: "이벤트명", key: "title" },
    {
      header: "유저 액션",
      key: "user_action",
      render: (_, row: IEvent) => (row?.type ? eventTypeAction[row.type] : ""),
    },
    {
      header: "이벤트 작품",
      key: "target_product_ids",
      render: (_, row: IEvent) =>
        row.target_product_ids.replace("[", "").replace("]", ""),
    },
    {
      header: "보상",
      key: "reward_type",
      render: (_, row: IEvent) =>
        row?.reward_type ? eventRewardType[row.reward_type] : "",
    },
    {
      header: "지급 방식",
      key: "payment",
      render: (_, row: IEvent) =>
        row?.type === "view-3-times" ||
        row?.type === "add-product" ||
        row?.type === "add-comment"
          ? "기간내 유저액션 충족시 즉시 지급"
          : "",
    },
    { header: "증정 갯수", key: "reward_amount" },
    { header: "최대 인원", key: "reward_max_people" },
    {
      header: "이벤트 기간",
      key: "date",
      render: (_, row: IEvent) => formatDateRange(row.start_date, row.end_date),
    },
    {
      header: "구분",
      key: "status",
      render: (_, row: IEvent) => (row.status ? eventStatus[row.status] : ""),
    },
    {
      header: "노출",
      key: "show",
      render: (_, row: IEvent) => (
        <Switch
          checked={row.show === "Y"}
          onCheckedChange={() => handleOnOfEvent(row.show === "Y", row.id + "")}
        />
      ),
    },
    {
      header: "수령인",
      key: "download",
      render: (_, row: IEvent) => (
        <Button
          variant="outline"
          onClick={() => handleDownload(row.id + "", row.title)}
        >
          엑셀 다운로드
        </Button>
      ),
    },
    {
      header: "관리",
      key: "actions",
      render: (_, row: IEvent) => (
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
      <FullPageLoader
        isLoading={
          isLoading ||
          deleteEvent.isPending ||
          onEvent.isPending ||
          offEvent.isPending
        }
      />
    </>
  );
}
