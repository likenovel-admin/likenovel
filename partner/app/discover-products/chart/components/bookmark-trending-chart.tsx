"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartDarkTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { BookmarkTrend } from "@/types/product-discovery-statistics";
import { format } from "date-fns";
const chartData = [
  { month: "06.01", desktop: 186, mobile: 80 },
  { month: "06.02", desktop: 305, mobile: 200 },
  { month: "06.03", desktop: 237, mobile: 120 },
  { month: "06.04", desktop: 73, mobile: 190 },
  { month: "06.05", desktop: 209, mobile: 130 },
  { month: "06.06", desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: "선호작",
    color: "hsl(var(--chart-7))",
  },
  mobile: {
    label: "선호작 해제",
    color: "hsl(var(--chart-8))",
  },
} satisfies ChartConfig;

const BookmarkTrendingChart = ({ data }: { data: BookmarkTrend[] }) => {
  const isMoblie = useIsMobile();
  const formatData = React.useMemo(() => {
    return data.map((d) => {
      return {
        month: d.date ? format(d.date, "MM.dd") : "",
        desktop: d.count_bookmark,
        mobile: d.count_unbookmark,
      };
    });
  }, [data]);

  const sumBookmark = React.useMemo(() => {
    return data.reduce((acc, cur) => acc + cur.count_bookmark, 0);
  }, [data]);
  const sumUnBookmark = React.useMemo(() => {
    return data.reduce((acc, cur) => acc + cur.count_unbookmark, 0);
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>선호작 추이</CardTitle>
        {/*<CardDescription>January - June 2024</CardDescription>*/}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between border border-zinc-300 rounded-lg px-4 py-2">
          <div className="w-full text-center">
            <div className="text-sm text-zinc-400 font-medium">
              {chartConfig.desktop.label}
            </div>
            <div className="text-lg text-[#4D51C0] font-semibold">
              {sumBookmark}회
            </div>
          </div>
          <Separator orientation="vertical" className="mx-1 h-9" />
          <div className="w-full text-center">
            <div className="text-sm text-zinc-400 font-medium">
              {chartConfig.mobile.label}
            </div>
            <div className="text-lg text-[#F8A70B] font-semibold">
              {sumUnBookmark}회
            </div>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={formatData}
            margin={{
              top: 10,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#E4E7F1"
              strokeDasharray="5 5"
            />
            <XAxis
              dataKey="month"
              tickLine={true}
              tickMargin={10}
              axisLine={true}
              tickFormatter={(value) => value.slice(0, 5)}
            />
            <ChartTooltip
              content={<ChartDarkTooltipContent hideLabel={true} />}
            />
            {/*<ChartLegend content={<ChartLegendContent />} />*/}
            <Bar
              dataKey="mobile"
              stackId="a"
              fill="var(--color-mobile)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="desktop"
              stackId="a"
              fill="var(--color-desktop)"
              radius={[4, 4, 0, 0]}
            >
              {isMoblie && (
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
              )}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
export default BookmarkTrendingChart;
