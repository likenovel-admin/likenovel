"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { IStatisticPayment } from "@/types/statistic";

interface Props {
  data: IStatisticPayment[];
  loading?: boolean;
}

const columns: Column[] = [
  { header: "Date", key: "date" },
  { header: "결제 횟수", key: "pay_count" },
  { header: "결제 코인", key: "pay_coin" },
  { header: "결제 금액", key: "pay_amount" },
  { header: "코인 사용 횟수", key: "use_coin_count" },
  { header: "코인 사용량", key: "use_coin" },
  { header: "후원 횟수", key: "donation_count" },
  { header: "후원 코인", key: "donation_coin" },
  { header: "광고 수익", key: "ad_revenue" },
];

export default function StatisticsTable({ data, loading }: Props) {
  return <CommonTable columns={columns} data={data} loading={loading} />;
}
