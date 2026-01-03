"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CommonTable, { Column } from "@/components/common/CommonTable";
import {
  IIncomeSettlement,
  IIncomeSettlementSummary,
} from "@/types/income-settlement";
import { format } from "date-fns";

interface Props {
  data: IIncomeSettlement[];
  loading?: boolean;
}

export default function AdminDonationTable({ data, loading }: Props) {
  const columns: Column[] = [
    {
      header: "Date",
      key: "created_date",
      render: (_, row: IIncomeSettlement) => {
        return row.created_date
          ? format(new Date(row.created_date), "yyyy.MM.dd")
          : "";
      },
    },
    {
      header: "작가명",
      key: "author_name",
    },
    {
      header: "후원 구분",
      key: "item_type",
      render: (_, row: IIncomeSettlement) =>
        row.item_type ? incomeSettlementItemType[row.item_type] : "",
    },
    {
      header: "금액",
      key: "sum_income_price",
    },
    {
      header: "결제 및 서비스 수수료",
      key: "total_fee_rate",
      render: (_, row: IIncomeSettlement) => (row.total_fee_rate || 0) + "%",
    },
    {
      header: "제외 후 금액",
      key: "sum_income_price_exclude_fee",
    },
    {
      header: "원천징수 세금",
      key: "withholding_tax_rate",
    },
    {
      header: "최종 정산액",
      key: "sum_income_price_final",
    },
    {
      header: "누적 후원 수익",
      key: "sum_donation_price",
    },
    {
      header: "누적 기타 수익",
      key: "sum_etc_income_price",
    },
    {
      header: "정산 가능액",
      key: "enable_settlement",
    },
    {
      header: "정산 완료액",
      key: "settled_price",
    },
  ];

  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
    </>
  );
}

import React from "react";
import { incomeSettlementItemType } from "@/constants/income-settlement";

type AuthorTableProps = {
  data: IIncomeSettlementSummary;
};

const formatNumber = (value: number) => {
  return value === 0 ? "0" : value;
};

export const AuthorDonationTable: React.FC<AuthorTableProps> = ({ data }) => {
  const { current, accumulated } = data;

  const sponsorshipRows = [
    {
      label: "일반 결제 후원",
      data: current.sponsorship.web,
    },
    {
      label: "인앱 결제 후원(iOS)",
      data: current.sponsorship.ios,
    },
    {
      label: "인앱 결제 후원(Google)",
      data: current.sponsorship.playstore,
    },
    {
      label: "인앱 결제 후원(원스토어)",
      data: current.sponsorship.onestore,
    },
    {
      label: "광고",
      data: current.ad,
    },
  ];

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <b>후원 구분</b>
            </TableHead>
            <TableHead className="border-l">
              <b>금액</b>
            </TableHead>
            <TableHead className="border-l">결제 및 서비스 수수료</TableHead>
            <TableHead className="border-l">제외 후 금액</TableHead>
            <TableHead className="border-l">원천징수 세금</TableHead>
            <TableHead className="border-l">최종 정산액</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sponsorshipRows.map((item, index) => (
            <TableRow key={index}>
              <TableHead>{item.label}</TableHead>
              <TableCell className="border-l">
                {formatNumber(item.data.sum_income_price)}
              </TableCell>
              <TableCell className="border-l">
                {formatNumber(item.data.total_fee_rate)}
              </TableCell>
              <TableCell className="border-l">
                {formatNumber(item.data.sum_income_price_exclude_fee)}
              </TableCell>
              <TableCell className="border-l">
                {formatNumber(item.data.withholding_tax_rate)}
              </TableCell>
              <TableCell className="border-l">
                {formatNumber(item.data.sum_income_price_final)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <b>누적 수익 정보</b>
      <Table className="w-[30%] mt-4">
        <TableBody>
          <TableRow>
            <TableHead>누적 후원 수익</TableHead>
            <TableCell className="border-l">
              {formatNumber(accumulated.income_sponsorship)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead>누적 기타 수익</TableHead>
            <TableCell className="border-l">
              {formatNumber(accumulated.income_etc)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead>정산 가능액</TableHead>
            <TableCell className="border-l">
              {formatNumber(accumulated.enable_settlement_price)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableHead>정산 완료액</TableHead>
            <TableCell className="border-l">
              {formatNumber(accumulated.completed_settlement_price)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
};
