"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type AiReaderHourlyRow = {
  hour: number;
  read_count?: number;
  recommend_count?: number;
  unrecommend_count?: number;
  bookmark_count?: number;
  unbookmark_count?: number;
  evaluation_count?: number;
  drop_count?: number;
};

type Props = {
  data: AiReaderHourlyRow[];
  height?: number;
};

const FILL = {
  read: "#3b82f6",
  recommend: "#10b981",
  unrecommend: "#a7f3d0",
  bookmark: "#f59e0b",
  unbookmark: "#fed7aa",
  evaluation: "#8b5cf6",
  drop: "#ef4444",
};

export default function AiReaderHourlyBarChart({ data, height = 240 }: Props) {
  const normalized = Array.from({ length: 24 }, (_, hour) => {
    const row = data.find((item) => Number(item.hour) === hour);
    return {
      hour,
      label: `${String(hour).padStart(2, "0")}`,
      read: Number(row?.read_count || 0),
      recommend: Number(row?.recommend_count || 0),
      unrecommend: Number(row?.unrecommend_count || 0),
      bookmark: Number(row?.bookmark_count || 0),
      unbookmark: Number(row?.unbookmark_count || 0),
      evaluation: Number(row?.evaluation_count || 0),
      drop: Number(row?.drop_count || 0),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={normalized} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={4} />
        <YAxis tick={{ fontSize: 11 }} width={36} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          labelFormatter={(value) => `${value}시`}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="read" name="조회" stackId="a" fill={FILL.read} />
        <Bar dataKey="recommend" name="추천" stackId="a" fill={FILL.recommend} />
        <Bar dataKey="unrecommend" name="추천 해제" stackId="a" fill={FILL.unrecommend} />
        <Bar dataKey="bookmark" name="선호" stackId="a" fill={FILL.bookmark} />
        <Bar dataKey="unbookmark" name="선호 해제" stackId="a" fill={FILL.unbookmark} />
        <Bar dataKey="evaluation" name="평가" stackId="a" fill={FILL.evaluation} />
        <Bar dataKey="drop" name="드롭" stackId="a" fill={FILL.drop} />
      </BarChart>
    </ResponsiveContainer>
  );
}
