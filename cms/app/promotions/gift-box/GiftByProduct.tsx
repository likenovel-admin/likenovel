"use client";

import { usePostDirectPromotionGift } from "@/api/directPromotion";
import FullPageLoader from "@/components/common/FullPageLoader";
import MultiProductSearch from "@/components/common/MultiProductSearch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { IProduct } from "@/types/product";
import { X } from "lucide-react";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";

export default function GiftByProduct() {
  const postGift = usePostDirectPromotionGift();
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedProducts, setSelectedProducts] = useState<IProduct[]>([]);

  const handleSubmit = async () => {
    if (postGift.isPending) return;

    if (selectedProducts.length === 0) {
      showAlert("알림", "작품을 선택해주세요.", "확인");
      return;
    }
    if (ticketCount < 1) {
      showAlert("알림", "대여권 수를 1개 이상 입력해주세요.", "확인");
      return;
    }
    if (!startDate || !endDate) {
      showAlert("알림", "시작일과 종료일을 모두 선택해주세요.", "확인");
      return;
    }

    postGift.mutate(
      {
        product_ids: selectedProducts.map((p) => p.product_id),
        num_of_ticket_per_person: ticketCount,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      },
      {
        onSuccess: (data) => {
          showAlert(
            "완료",
            `${data.result.created_count}개 작품에 프로모션이 등록되었습니다.`,
            "확인"
          );
          setSelectedProducts([]);
          setTicketCount(1);
          setStartDate(undefined);
          setEndDate(undefined);
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>작품별 대여권 지급</span>
            <Button onClick={handleSubmit} disabled={postGift.isPending}>
              등록
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table classNameWrap="static">
            <TableBody>
              <TableRow>
                <TableHead className="w-[160px] require">대여권 수</TableHead>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={ticketCount}
                    onChange={(e) =>
                      setTicketCount(Math.max(1, Number(e.target.value)))
                    }
                    className="w-[120px]"
                  />
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
              <TableRow>
                <TableHead className="require">작품 검색</TableHead>
                <TableCell>
                  <MultiProductSearch
                    selectedProducts={selectedProducts}
                    setSelectedProducts={setSelectedProducts}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          {selectedProducts.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                선택된 작품 ({selectedProducts.length}개)
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>작품명</TableHead>
                    <TableHead className="w-[60px]">삭제</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProducts.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell>{product.product_id}</TableCell>
                      <TableCell>{product.title}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedProducts((prev) =>
                              prev.filter(
                                (p) => p.product_id !== product.product_id
                              )
                            )
                          }
                          className="hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <FullPageLoader isLoading={postGift.isPending} />
    </>
  );
}
