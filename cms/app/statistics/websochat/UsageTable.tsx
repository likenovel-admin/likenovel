"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { IStatisticWebsochatUsage } from "@/types/statistic";

interface Props {
  data: IStatisticWebsochatUsage[];
  loading?: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return String(value).replace("T", " ").slice(0, 19);
};

const columns: Column[] = [
  { header: "시각", key: "created_date", render: (value) => formatDate(value) },
  { header: "작품", key: "product_title" },
  { header: "세션", key: "session_title" },
  { header: "회원", key: "email", render: (value, row) => value || row.nickname || row.guest_key || "guest" },
  { header: "모델", key: "model_used" },
  { header: "라우트", key: "route_mode" },
  { header: "의도", key: "intent" },
  { header: "Fallback", key: "fallback_used" },
  { header: "차감 캐시", key: "charged_cash" },
];

export default function UsageTable({ data, loading }: Props) {
  return <CommonTable columns={columns} data={data} loading={loading} emptyMessage="웹소챗 사용 로그가 없습니다." />;
}
