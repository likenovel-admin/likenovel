"use client";
import {
  getDownloadHourlyInflowDetail,
  useGetHourlyInflowDetail,
} from "@/api/hourly-inflow";
import { IGetHourlyInflowDetailParams } from "@/api/hourly-inflow/dto";
import { Search1DateNText } from "@/components/common/Search1DateNText";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { item_per_page } from "@/constants/common";
import { HourlyInflow } from "@/constants/hourly-inflow";
import { downloadExcel } from "@/lib/excelDownload";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { IHourlyInflowDetail } from "@/types/hourly-inflow";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import FullPageLoader from "@/components/common/FullPageLoader";

const firstColumn = [
  "총 조회수",
  "총 결제 건수",
  "남성 조회수",
  "여성 조회수",
  "남성 총 결제 건수",
  "여성 총 결제 건수",
  "남성 20대 이하 결제 건수",
  "남성 30대 결제 건수",
  "남성 40대 결제 건수",
  "남성 50대 결제 건수",
  "남성 60대 이상 결제 건수",
  "여성 20대 이하 결제 건수",
  "여성 30대 결제 건수",
  "여성 40대 결제 건수",
  "여성 50대 결제 건수",
  "여성 60대 이상 결제 건수",
  "남성 20대 이하 조회수",
  "남성 30대 조회수",
  "남성 40대 조회수",
  "남성 50대 조회수",
  "남성 60대 이상 조회수",
  "여성 20대 이하 조회수",
  "여성 30대 조회수",
  "여성 40대 조회수",
  "여성 50대 조회수",
  "여성 60대 이상 조회수",
];

export default function Page() {
  const pathname = usePathname();
  console.log(pathname);
  const pathSegments = pathname.split("/");
  const searchParams = useSearchParams();
  const title = searchParams.get("title");
  const episodeId = pathSegments[pathSegments.length - 1];

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilers] = useState<IGetHourlyInflowDetailParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
    search_date: "",
  });

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetHourlyInflowDetail(
    episodeId,
    {
      page: filters.page,
      count_per_page: filters.count_per_page,
      search_target: filters.search_target || undefined,
      search_word: filters.search_word || undefined,
      search_date: filters.search_date
        ? format(filters.search_date, "yyyy-MM-dd")
        : undefined,
    },
    !!episodeId
  );

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleDownloadExcel = async () => {
    try {
      setIsLoading(true);

      const res = await getDownloadHourlyInflowDetail({
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
        search_date: filters.search_date || undefined,
        id: episodeId,
      });

      const data = res || [];

      const rows = firstColumn.map((label) => {
        const field = HourlyInflow[label] as keyof IHourlyInflowDetail;
        const hourData = Array.from({ length: 24 }).reduce<
          Record<number, string | number>
        >((acc, _, i) => {
          acc[i + 1] = data?.[i]?.[field] ?? "";
          return acc;
        }, {});

        return {
          title: label,
          ...hourData,
        };
      });

      const headers = ["", ...Array.from({ length: 24 }, (_, i) => `${i + 1}`)];

      const excelData = rows.map((row) => {
        const { title, ...hours } = row;
        return {
          "": title,
          ...hours,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData, {
        header: headers,
      });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "시간별 유입 분석");

      XLSX.writeFile(
        workbook,
        `시간별_유입_분석-${format(new Date(), "yyMMdd")}.xlsx`
      );

      setIsLoading(false);
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
      setIsLoading(false);
    }
  };

  const handleOnSearch = (filters: IGetHourlyInflowDetailParams) => {
    setFilers(filters);
  };
  const handleOnReset = () => {
    setFilers({
      page: 1,
      count_per_page: item_per_page,
      search_target: "",
      search_word: "",
    });
  };
  // const isMobile = useIsMobile()

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader
          title="시간별 유입 분석"
          parent="통계 분석"
          child="시간별 유입 분석"
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <Search1DateNText
              options={[{ value: "product-title", label: "작품명" }]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            {/* <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button> */}
          </div>
          <b>{title}</b>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                {Array.from({ length: 24 }).map((_, index) => (
                  <TableHead
                    key={`time-hour-${index}`}
                    className="text-center border-l w-[60px]"
                  >
                    {index + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {firstColumn.map((label, index) => (
                <TableRow key={`products-row-${index}`}>
                  <TableCell>{label}</TableCell>
                  {Array.from({ length: 24 }).map((_, index2) => (
                    <TableHead
                      key={`time-value-${index}-${index2}`}
                      className="text-center border-l"
                    >
                      {(() => {
                        const field = HourlyInflow[
                          label
                        ] as keyof IHourlyInflowDetail;
                        return data?.[index2]?.[field] ?? "-";
                      })()}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <FullPageLoader isLoading={isLoading || isFetching} />
        </div>
      </SidebarInset>
    </>
  );
}
