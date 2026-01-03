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
import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
const chartData = [
  {
    browser: "firstEpisodeHitCount",
    visitors: 275,
    fill: "var(--color-firstEpisodeHitCount)",
  },
  {
    browser: "latestEpisodeHitCount",
    visitors: 200,
    fill: "var(--color-latestEpisodeHitCount)",
  },
  /*{ browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
    { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
    { browser: "other", visitors: 90, fill: "var(--color-other)" },*/
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  firstEpisodeHitCount: {
    label: "첫화 조회수",
    color: "hsl(var(--chart-7))",
  },
  latestEpisodeHitCount: {
    label: "최신화 조회수",
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

const EarlyViewsHitCountChart = ({
  first_episode_count_hit_in_24h,
  latest_episode_count_hit_in_24h,
}: {
  first_episode_count_hit_in_24h: number;
  latest_episode_count_hit_in_24h: number;
}) => {
  const formatData = React.useMemo(() => {
    return [
      {
        browser: "firstEpisodeHitCount",
        visitors: first_episode_count_hit_in_24h,
        fill: "var(--color-firstEpisodeHitCount)",
      },
      {
        browser: "latestEpisodeHitCount",
        visitors: latest_episode_count_hit_in_24h,
        fill: "var(--color-latestEpisodeHitCount)",
      },
    ];
  }, [first_episode_count_hit_in_24h, latest_episode_count_hit_in_24h]);

  const isMoblie = useIsMobile();
  return (
    <Card>
      <CardHeader>
        <CardTitle>24시간 조회수(초동 조회수)</CardTitle>
        {/*<CardDescription>January - June 2024</CardDescription>*/}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between border border-zinc-300 rounded-lg px-4 py-2">
          <div className="w-full text-center">
            <div className="text-sm text-zinc-400 font-medium">
              {chartConfig.firstEpisodeHitCount.label}
            </div>
            <div className="text-lg text-[#4D51C0] font-semibold">
              {first_episode_count_hit_in_24h}회
            </div>
          </div>
          <Separator orientation="vertical" className="mx-1 h-9" />
          <div className="w-full text-center">
            <div className="text-sm text-zinc-400 font-medium">
              {chartConfig.latestEpisodeHitCount.label}
            </div>
            <div className="text-lg text-[#F8A70B] font-semibold">
              {latest_episode_count_hit_in_24h}회
            </div>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart
            accessibilityLayer
            data={formatData}
            margin={{
              top: 35,
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
export default EarlyViewsHitCountChart;
