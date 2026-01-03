"use client";
import { useAddAppliedPromotion } from "@/api/appliedPromotion";
import FullPageLoader from "@/components/common/FullPageLoader";
import ProductSearch from "@/components/common/ProductSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";

const options = [
  {
    value: "waiting-for-free",
    label: "기다리면 무료 ",
  },
  {
    value: "6-9-path",
    label: "69 패스",
  },
];

export default function Page() {
  // const isMobile = useIsMobile()
  const router = useRouter();
  const addAppliedPromotion = useAddAppliedPromotion();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [product, setProduct] = useState<number | undefined>(undefined);
  const [type, setType] = useState<string>("");

  const handleSubmit = async () => {
    if (addAppliedPromotion.isPending) {
      return;
    }
    if (!product) {
      showAlert("알림", "작품을 선택해주세요.", "확인");
      return;
    }

    if (!type) {
      showAlert("알림", "프로모션 종류를 선택해주세요.", "확인");
      return;
    }

    if (!startDate || !endDate) {
      showAlert("알림", "시작일과 종료일을 모두 선택해주세요.", "확인");
      return;
    }

    addAppliedPromotion.mutate(
      {
        product_id: product,
        type: type,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      },
      {
        onSuccess: () => {
          router.push("/promotions/apply-of-promotion");
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  const handleCancel = () => {
    router.push("/promotions/apply-of-promotion");
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>신청 프로모션 추가</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    취소
                  </Button>
                  <Button onClick={handleSubmit}>추가</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <hr />
              <Table classNameWrap="static">
                <TableBody>
                  <TableRow>
                    <TableHead className="require">작품명</TableHead>
                    <TableCell>
                      <ProductSearch
                        default={product}
                        setProduct={setProduct}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">프로모션 종류</TableHead>
                    <TableCell>
                      <Select
                        value={type}
                        onValueChange={(val) => setType(val)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue
                            defaultValue={"value"}
                            placeholder="기다리면 무료"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {options.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">시작일</TableHead>
                    <TableCell>
                      <ReactDatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date ?? undefined)}
                        dateFormat="yyyy-MM-dd"
                        maxDate={endDate}
                        placeholderText="시작일"
                        className="border px-3 py-2 rounded text-sm w-[140px]"
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">종료일</TableHead>
                    <TableCell>
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
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <FullPageLoader isLoading={addAppliedPromotion.isPending} />
      </SidebarInset>
    </>
  );
}
