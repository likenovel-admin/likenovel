"use client";

import { CircleHelp, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
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
  ChartTooltipValueContent,
} from "@/components/ui/chart";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import { ReadingRateTrend } from "@/types/product-discovery-statistics";
import { format } from "date-fns";
import { useMemo } from "react";
const chartData = [
  { date: "24.06.01", desktop: 186, mobile: 80 },
  { date: "24.06.02", desktop: 305, mobile: 200 },
  { date: "24.06.03", desktop: 237, mobile: 120 },
  { date: "24.06.04", desktop: 73, mobile: 190 },
  { date: "24.06.05", desktop: 209, mobile: 130 },
  { date: "24.06.06", desktop: 214, mobile: 140 },
];

const chartConfig = {
  /*desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },*/
  mobile: {
    label: "Data",
    color: "hsl(var(--chart-6))",
  },
} satisfies ChartConfig;

const ReadRatingChart = ({ data }: { data: ReadingRateTrend[] }) => {
  const isMoblie = useIsMobile();
  const formatData = useMemo(() => {
    return data.map((d) => {
      return {
        date: d.date ? format(d.date, "yy.MM.dd") : "",
        mobile: d.reading_rate,
      };
    });
  }, [data]);
  return (
    <Card>
      <CardHeader className="border-b border-zinc-400">
        <CardTitle className="flex items-center gap-1.5">
          <span>기간별 연독률 통계</span>
          <Popover>
            <PopoverTrigger>
              <CircleHelp
                size={19}
                strokeWidth={1.3}
                fill="#000000"
                className="text-white font-semibold"
              />
            </PopoverTrigger>
            <PopoverContent>
              최근 7일 동안의 연독률 수를 보여줍니다.
            </PopoverContent>
          </Popover>
        </CardTitle>
        {/*<CardDescription className="flex items-center gap-1.5">
                    <span>최근 7일 동안의 연독률 수를 보여줍니다.</span>
                </CardDescription>*/}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            /*accessibilityLayer*/
            data={formatData}
            margin={{
              top: 40,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#E4E7F1"
              strokeDasharray="5 5"
            />
            {!isMoblie && <YAxis />}
            <XAxis
              dataKey="date"
              tickLine={true}
              axisLine={true}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 8)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipValueContent
                  className="bg-black"
                  hideIndicator={true}
                  hideLabel={true}
                  defaultIndex={1}
                />
              }
            />
            <defs>
              {/*<linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-desktop)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-desktop)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>*/}
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.9}
                />
                <stop
                  offset="70%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              fillOpacity={0.4}
              stroke="var(--color-mobile)"
              stackId="a"
            >
              {isMoblie && (
                <LabelList
                  position="top"
                  offset={12}
                  className="fill-foreground"
                  fontSize={12}
                />
              )}
            </Area>
            {/*<Area
                            dataKey="desktop"
                            type="natural"
                            fill="url(#fillDesktop)"
                            fillOpacity={0.4}
                            stroke="var(--color-desktop)"
                            stackId="a"
                        />*/}
          </AreaChart>
        </ChartContainer>
      </CardContent>
      {/*<CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 font-medium leading-none">
                            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2 leading-none text-muted-foreground">
                            January - June 2024
                        </div>
                    </div>
                </div>
            </CardFooter>*/}
    </Card>
  );
};
export default ReadRatingChart;
