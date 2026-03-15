"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import {
  catchErrorMessage,
  isTimeFormatValid,
  isValidTimeRange,
  showAlert,
} from "@/lib/utils";
import {
  useEditDirectRecommend,
  useGetDirectRecommendDetail,
} from "@/api/directRecommend";
import ReactDatePicker from "react-datepicker";
import FullPageLoader from "@/components/common/FullPageLoader";

export default function Page() {
  // const isMobile = useIsMobile()
  const router = useRouter();
  const params = useParams();
  const editDirectRecommend = useEditDirectRecommend();
  const directRecommendId = Array.isArray(params.directRecommendId)
    ? params.directRecommendId[0]
    : params.directRecommendId;
  const { data, isLoading, isFetching } = useGetDirectRecommendDetail(
    directRecommendId || ""
  );

  const [name, setName] = useState<string>("");
  const [order, setOrder] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTimeWeekday, setStartTimeWeekday] = useState<string>("");
  const [endTimeWeekday, setEndTimeWeekday] = useState<string>("");
  const [startTimeWeekend, setStartTimeWeekend] = useState<string>("");
  const [endTimeWeekend, setEndTimeWeekend] = useState<string>("");
  const [product, setProduct] = useState<string>("");

  useEffect(() => {
    if (data) {
      setProduct(
        data.product_ids ? JSON.parse(data.product_ids).join(",") : ""
      );
      setOrder(String(data.order));
      setName(data.name);
      setStartDate(new Date(data.exposure_start_date));
      setEndDate(new Date(data.exposure_end_date));
      setStartTimeWeekday(data.exposure_start_time_weekday);
      setEndTimeWeekday(data.exposure_end_time_weekday);
      setStartTimeWeekend(data.exposure_start_time_weekend);
      setEndTimeWeekend(data.exposure_end_time_weekend);
    }
  }, [data]);

  const handleSubmit = async () => {
    if (editDirectRecommend.isPending) {
      return;
    }
    if (!name.trim()) {
      showAlert("오류", "추천구좌명을 입력해주세요.", "확인");
      return;
    }
    if (!order || isNaN(Number(order)) || Number(order) <= 0) {
      showAlert("오류", "노출 순서를 0보다 큰 숫자로 입력해주세요.", "확인");
      return;
    }
    if (!startDate || !endDate) {
      showAlert("오류", "노출 기간을 입력해주세요.", "확인");
      return;
    }
    if (
      !isTimeFormatValid(startTimeWeekday) ||
      !isTimeFormatValid(endTimeWeekday) ||
      !isValidTimeRange(startTimeWeekday, endTimeWeekday)
    ) {
      showAlert(
        "오류",
        "주중 노출 시간을 정확히 입력해주세요. (예: 09:00 ~ 18:00)",
        "확인"
      );
      return;
    }
    if (
      !isTimeFormatValid(startTimeWeekend) ||
      !isTimeFormatValid(endTimeWeekend) ||
      !isValidTimeRange(startTimeWeekend, endTimeWeekend)
    ) {
      showAlert(
        "오류",
        "주말 노출 시간을 정확히 입력해주세요. (예: 10:00 ~ 20:00)",
        "확인"
      );
      return;
    }
    if (!product.trim()) {
      showAlert("오류", "노출 작품을 입력해주세요.", "확인");
      return;
    }
    editDirectRecommend.mutate(
      {
        id: directRecommendId || "",
        body: {
          name,
          order: Number(order),
          exposure_start_date: format(startDate, "yyyy-MM-dd"),
          exposure_end_date: format(endDate, "yyyy-MM-dd"),
          exposure_start_time_weekday: startTimeWeekday,
          exposure_end_time_weekday: endTimeWeekday,
          exposure_start_time_weekend: startTimeWeekend,
          exposure_end_time_weekend: endTimeWeekend,
          product_ids: product
            .split(",")
            .filter((item) => item && item.trim())
            .map((id) => Number(id.trim())),
        },
      },
      {
        onSuccess: () => {
          router.push("/exposure-accounts/direct-recommend");
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  const handleCancel = () => {
    router.push("/exposure-accounts/direct-recommend");
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="직접 추천구좌 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>직접 추천구좌 관리</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    취소
                  </Button>
                  <Button onClick={handleSubmit}>추가</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHead className="require">추천구좌명</TableHead>
                    <TableCell>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">노출 순서</TableHead>
                    <TableCell>
                      <Input
                        type="number"
                        value={order}
                        onChange={(e) => setOrder(e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">노출 기간</TableHead>
                    <TableCell className="flex items-center gap-2">
                      <ReactDatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date ?? undefined)}
                        dateFormat="yyyy-MM-dd"
                        maxDate={endDate}
                        placeholderText="시작일"
                        className="border px-3 py-2 rounded text-sm w-[140px]"
                      />
                      ~
                      <ReactDatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date ?? undefined)}
                        dateFormat="yyyy-MM-dd"
                        minDate={startDate}
                        placeholderText="종료일"
                        className="border px-3 py-2 rounded text-sm w-[140px]"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">노출 시간</TableHead>
                    <TableCell>
                      <div className="mb-2">주중</div>
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          placeholder="HH:mm"
                          value={startTimeWeekday}
                          onChange={(e) => setStartTimeWeekday(e.target.value)}
                        />
                        ~
                        <Input
                          placeholder="HH:mm"
                          value={endTimeWeekday}
                          onChange={(e) => setEndTimeWeekday(e.target.value)}
                        />
                      </div>
                      <div className="mb-2">주말</div>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="HH:mm"
                          value={startTimeWeekend}
                          onChange={(e) => setStartTimeWeekend(e.target.value)}
                        />
                        ~
                        <Input
                          placeholder="HH:mm"
                          value={endTimeWeekend}
                          onChange={(e) => setEndTimeWeekend(e.target.value)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">노출 작품</TableHead>
                    <TableCell>
                      <Textarea
                        className="h-[100px]"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        placeholder="작품명을 입력하세요"
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <FullPageLoader
          isLoading={isLoading || isFetching || editDirectRecommend.isPending}
        />
      </SidebarInset>
    </>
  );
}
