"use client";

import CommonTable, { Column } from "@/components/common/CommonTable";
import { IStatisticPaymentByUser } from "@/types/statistic";

interface Props {
  data: IStatisticPaymentByUser[];
  loading?: boolean;
  selectionMode?: boolean;
  selectedRowKey?: string | null;
  onSelectRow?: (
    row: IStatisticPaymentByUser,
    rowIndex: number,
    checked: boolean
  ) => void;
}

const baseColumns: Column[] = [
  { header: "주문시각", key: "order_datetime" },
  { header: "주문번호", key: "order_no" },
  { header: "이메일", key: "email" },
  { header: "닉네임", key: "nickname" },
  { header: "결제 횟수", key: "pay_count" },
  { header: "결제 코인", key: "pay_coin" },
  { header: "결제 금액", key: "pay_amount" },
];

const getRowKey = (row: IStatisticPaymentByUser, rowIndex: number) => {
  const orderId = row.cash_order_id ?? row.cashOrderId;
  if (orderId !== undefined && orderId !== null) {
    return `order-${orderId}`;
  }

  const userKey = row.user_id ?? row.userId ?? row.email ?? "unknown";
  return `${row.date}-${userKey}-${rowIndex}`;
};

export default function StatisticsTable({
  data,
  loading,
  selectionMode = false,
  selectedRowKey = null,
  onSelectRow,
}: Props) {
  const columns: Column[] = selectionMode
    ? [
        {
          header: "",
          key: "__select",
          render: (_value: unknown, row: IStatisticPaymentByUser, index = 0) => {
            const rowKey = getRowKey(row, index);
            const checked = selectedRowKey === rowKey;

            return (
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer"
                checked={checked}
                onChange={(e) => onSelectRow?.(row, index, e.target.checked)}
                aria-label={`select-row-${index}`}
              />
            );
          },
        },
        ...baseColumns,
      ]
    : baseColumns;

  return <CommonTable columns={columns} data={data} loading={loading} />;
}
