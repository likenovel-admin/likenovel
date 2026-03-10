"use client";

import { TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReaderAnalysis } from "@/types/product-discovery-statistics";
const chartData = [
  { browser: "firstTarget", visitors: 48, fill: "var(--color-firstTarget)" },
  { browser: "secondTarget", visitors: 32, fill: "var(--color-secondTarget)" },
  /*{ browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
    { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
    { browser: "other", visitors: 90, fill: "var(--color-other)" },*/
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  firstTarget: {
    label: "1순위 대상",
    color: "hsl(var(--chart-7))",
  },
  secondTarget: {
    label: "2순위 대상",
    color: "hsl(var(--chart-8))",
  },
  /*firefox: {
        label: "Firefox",
        color: "hsl(var(--chart-3))",
    },
    edge: {
        label: "Edge",
        color: "hsl(var(--chart-4))",
    },
    other: {
        label: "Other",
        color: "hsl(var(--chart-5))",
    },*/
} satisfies ChartConfig;

const TargetReaderAnalysisChart = ({
  data,
  primary_reader_group1,
  primary_reader_group2,
}: {
  data: ReaderAnalysis[];
  primary_reader_group1: string;
  primary_reader_group2: string;
}) => {
  const isMoblie = useIsMobile();
  const formatData = useMemo(() => {
    return [
      {
        browser: "firstTarget",
        visitors: data?.[0]?.percent || 0,
        fill: "var(--color-firstTarget)",
      },
      {
        browser: "secondTarget",
        visitors: data?.[1]?.percent || 0,
        fill: "var(--color-secondTarget)",
      },
    ];
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>타겟독자 분석</CardTitle>
        {/*<CardDescription>January - June 2024</CardDescription>*/}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between border border-zinc-300 rounded-lg px-4 py-2">
          <div className="w-full text-center">
            <div className="text-sm text-zinc-400 font-medium">
              {chartConfig.firstTarget.label}
            </div>
            <div className="text-lg text-[#4D51C0] font-semibold">
              {primary_reader_group1 ? `${primary_reader_group1}성` : (data?.[0]?.user_type || "-")}({data?.[0]?.percent ?? 0}%)
            </div>
          </div>
          <Separator orientation="vertical" className="mx-1 h-9" />
          <div className="w-full text-center">
            <div className="text-sm text-zinc-400 font-medium">
              {chartConfig.secondTarget.label}
            </div>
            <div className="text-lg text-[#F8A70B] font-semibold">
              {primary_reader_group2 ? `${primary_reader_group2}성` : (data?.[1]?.user_type || "-")}({data?.[1]?.percent ?? 0}%)
            </div>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={formatData}
            margin={{
              top: 10,
              left: 0,
            }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#E4E7F1"
              strokeDasharray="5 5"
            />
            <XAxis
              dataKey="browser"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) =>
                chartConfig[value as keyof typeof chartConfig]?.label
              }
            />
            {/*<ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel/>}
                        />*/}
            <Bar dataKey="visitors" radius={5}>
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
      {/*<CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 font-medium leading-none">
                    Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="leading-none text-muted-foreground">
                    Showing total visitors for the last 6 months
                </div>
            </CardFooter>*/}
    </Card>
  );
};
export default TargetReaderAnalysisChart;
