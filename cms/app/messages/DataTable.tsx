"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { IMessage } from "@/types/message";
import { format } from "date-fns";

interface Props {
  data: IMessage[];
  loading?: boolean;
}

const columns: Column[] = [
  { header: "대화방 key", key: "key" },
  {
    header: "전송 시간",
    key: "created_date",
    render: (_, row: IMessage) =>
      row?.created_date ? format(row.created_date, "yyyy-MM-dd HH:mm:ss") : "",
  },
  { header: "발송인", key: "sender_name" },
  { header: "수신인", key: "receiver_name" },
  { header: "내용", key: "content" },
];

export default function MessageTable({ data, loading }: Props) {
  return <CommonTable columns={columns} data={data} loading={loading} />;
}
