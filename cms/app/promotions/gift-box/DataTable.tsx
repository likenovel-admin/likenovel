"use client";

import { downloadUserGiftBook } from "@/api/userGiftBook";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { downloadExcel2Sheet } from "@/lib/excelDownload";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import {
  HistoryEntry,
  IUserGiftBook,
  ReceivedHistory,
  UsageHistory,
} from "@/types/userGiftbook";
import { format, formatDate } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  data: IUserGiftBook[];
  loading?: boolean;
  refetch: () => void;
}

export default function UserGiftTable({ data, loading }: Props) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (id: string) => {
    try {
      const api = () => downloadUserGiftBook(id);
      await downloadExcel2Sheet<HistoryEntry>({
        apiFn: api,
        sheets: [
          {
            sheetName: "받은 내역",
            sheetKey: "received_history",
            headers: [
              "대여권 지급 사유",
              "작품 제목",
              "작가명",
              "대여권 장수",
              "대여권 유효 기간",
              "선물받기 누른 날짜",
            ],
            fields: [
              "reason",
              "target_product_title",
              "target_product_author_name",
              "amount",
              (item: ReceivedHistory) =>
                item.expire_date
                  ? format(new Date(item.expire_date), "yyyy-MM-dd")
                  : "-",
              (item: ReceivedHistory) =>
                item.received_date
                  ? format(new Date(item.received_date), "yyyy-MM-dd")
                  : "",
            ],
          },
          {
            sheetName: "사용 내역",
            sheetKey: "usage_history",
            headers: ["사용한 작품 제목", "작가명", "대여권 종류", "사용 날짜"],
            fields: [
              "title",
              "author_name",
              "ticket_type",
              (item: UsageHistory) =>
                item.use_date
                  ? format(new Date(item.use_date), "yyyy-MM-dd")
                  : "-",
            ],
          },
        ],
        filename: `${id} 유저 선물함 내역 받은 내역`,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false),
        onError: (error) => {
          showAlert("오류", catchErrorMessage(error), "확인");
        },
      });
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
      setIsLoading(false);
    }
  };

  const columns: Column[] = [
    {
      header: "User_ID",
      key: "user_id",
    },
    { header: "이메일", key: "email" },
    { header: "지급된 혜택 수", key: "gift_count" },
    {
      header: "최근 지급일",
      key: "date",
      render: (_, row: IUserGiftBook) =>
        row.recent_gift_date
          ? formatDate(row.recent_gift_date, "yyyy-MM-dd")
          : "",
    },
    {
      header: "내역",
      key: "actions",
      render: (_, row: IUserGiftBook) => (
        <Button
          variant="outline"
          onClick={() => handleDownload(row.user_id + "")}
        >
          엑셀 다운로드
        </Button>
      ),
    },
  ];
  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
      <FullPageLoader isLoading={isLoading} />
    </>
  );
}
