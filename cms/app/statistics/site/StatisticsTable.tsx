"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { IStatisticSite } from "@/types/statistic";

interface Props {
  data: IStatisticSite[];
  loading?: boolean;
}

const columns: Column[] = [
  { header: "Date", key: "date" },
  { header: "방문자수", key: "visitors" },
  { header: "페이지뷰", key: "page_view" },
  { header: "로그인", key: "login_count" },
  { header: "회원가입", key: "signin_count" },
  { header: "회원탈퇴", key: "signoff_count" },
  { header: "DAU", key: "DAU" },
];

export default function StatisticsTable({ data, loading }: Props) {
  return <CommonTable columns={columns} data={data} loading={loading} />;
}
