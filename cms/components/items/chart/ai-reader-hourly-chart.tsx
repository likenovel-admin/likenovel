"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type AiReaderHourlyRow = {
  hour: number | string;
  read_count?: number;
  recommend_count?: number;
  bookmark_count?: number;
  evaluation_count?: number;
  drop_count?: number;
};

interface AiReaderHourlyChartProps {
  data: AiReaderHourlyRow[];
}

const chartConfig: ChartConfig = {
  read_count: {
    label: "읽기",
    color: "hsl(221, 83%, 53%)",
  },
  recommend_count: {
    label: "추천",
    color: "hsl(142, 71%, 45%)",
  },
  bookmark_count: {
    label: "선호",
    color: "hsl(48, 96%, 53%)",
  },
  evaluation_count: {
    label: "평가",
    color: "hsl(280, 65%, 60%)",
  },
};

const HOUR_KEYS = ["read_count", "recommend_count", "bookmark_count", "evaluation_count"] as const;

const padHour = (value: number | string) => `${String(value).padStart(2, "0")}시`;

export default function AiReaderHourlyChart({ data }: AiReaderHourlyChartProps) {
  // 24시간 슬롯 보장 (데이터가 없는 시는 0)
  const filled: AiReaderHourlyRow[] = Array.from({ length: 24 }, (_, hour) => {
    const found = data.find((row) => Number(row.hour) === hour);
    return {
      hour,
      read_count: Number(found?.read_count || 0),
      recommend_count: Number(found?.recommend_count || 0),
      bookmark_count: Number(found?.bookmark_count || 0),
      evaluation_count: Number(found?.evaluation_count || 0),
    };
  });

  const hasAnyValue = filled.some((row) =>
    HOUR_KEYS.some((key) => Number(row[key] || 0) > 0),
  );

  if (!hasAnyValue) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed bg-muted/10 text-xs text-muted-foreground">
        시간대 활동이 없습니다.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <BarChart accessibilityLayer data={filled} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 4" strokeOpacity={0.3} />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          interval={1}
          tickFormatter={(value) => padHour(value)}
          fontSize={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={32}
          fontSize={10}
          allowDecimals={false}
        />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(value) => padHour(value as number)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {HOUR_KEYS.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={`var(--color-${key})`}
            radius={key === "evaluation_count" ? [2, 2, 0, 0] : 0}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
