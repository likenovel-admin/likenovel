"use client";
import {
  useEditPublisherPromotion,
  useGetPublisherPromotionDetail,
} from "@/api/publisherPromotion";
import ProductSearch from "@/components/common/ProductSearch";
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
import {
  catchErrorMessage,
  isPositiveIntegerInput,
  showAlert,
} from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const params = useParams();
  const editPublisher = useEditPublisherPromotion();
  const publisherPromotionId = Array.isArray(params.publisherPromotionId)
    ? params.publisherPromotionId[0]
    : params.publisherPromotionId;
  const { data } = useGetPublisherPromotionDetail(publisherPromotionId || "");

  const [product, setProduct] = useState<number | undefined>(undefined);
  const [order, setOrder] = useState<string>("");

  useEffect(() => {
    if (data) {
      setProduct(data.product_id);
      setOrder(String(data.show_order));
    }
  }, [data]);

  const handleSubmit = async () => {
    if (editPublisher.isPending) {
      return;
    }
    if (!product) {
      showAlert("오류", "작품명을 선택해주세요.", "확인");
      return;
    }
    if (!order) {
      showAlert("오류", "노출 순서를 입력해주세요.", "확인");
      return;
    }
    editPublisher.mutate(
      {
        id: publisherPromotionId || "",
        body: {
          product_id: product,
          show_order: Number(order),
        },
      },
      {
        onSuccess: () => {
          route.push("/exposure-accounts/publisher-promotion");
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  const handleCancel = () => {
    route.push("/exposure-accounts/publisher-promotion");
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4"></div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <p>출판사 프로모션 구좌 작품 추가</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    취소
                  </Button>
                  <Button onClick={handleSubmit}>추가</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <hr />
              <Table>
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
                    <TableHead className="require">노출순서</TableHead>
                    <TableCell>
                      <Input
                        value={order}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (isPositiveIntegerInput(value) || value === "") {
                            setOrder(value);
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </>
  );
}
