"use client";
import { useEditCommonRate, useGetCommonRateDetail } from "@/api/commonRate";
import FullPageLoader from "@/components/common/FullPageLoader";
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
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { ICommonRate } from "@/types/commonRate";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const { data, isLoading, isFetching } = useGetCommonRateDetail();
  const updateCommonRate = useEditCommonRate();
  const [rates, setRates] = useState<ICommonRate>({
    default_settlement_rate: 0,
    donation_settlement_rate: 0,
    payment_fee_rate: 0,
    tax_amount_rate: 0,
  });

  useEffect(() => {
    if (data) {
      setRates({
        default_settlement_rate: data.default_settlement_rate ?? 0,
        donation_settlement_rate: data.donation_settlement_rate ?? 0,
        payment_fee_rate: data.payment_fee_rate ?? 0,
        tax_amount_rate: data.tax_amount_rate ?? 0,
      });
    }
  }, [data]);

  const handleChange =
    (field: keyof ICommonRate) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setRates((prev) => ({
        ...prev,
        [field]: parseFloat(e.target.value),
      }));
    };

  const handleSubmit = () => {
    if (updateCommonRate.isPending) return;
    updateCommonRate.mutate(rates, {
      onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
    });
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
                <span>비율 조정</span>
                <div>
                  <Button onClick={handleSubmit}>변경사항 저장</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <hr />
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHead>기본 정산율 - 작가 기준</TableHead>
                    <TableCell>
                      <Input
                        type="number"
                        step="any"
                        value={rates.default_settlement_rate}
                        onChange={handleChange("default_settlement_rate")}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>후원 정산율 - 작가 기준</TableHead>
                    <TableCell>
                      <Input
                        type="number"
                        step="any"
                        value={rates.donation_settlement_rate}
                        onChange={handleChange("donation_settlement_rate")}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>결제 수수료</TableHead>
                    <TableCell>
                      <Input
                        type="number"
                        step="any"
                        value={rates.payment_fee_rate}
                        onChange={handleChange("payment_fee_rate")}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead>세액</TableHead>
                    <TableCell>
                      <Input
                        type="number"
                        step="any"
                        value={rates.tax_amount_rate}
                        onChange={handleChange("tax_amount_rate")}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <FullPageLoader
          isLoading={isLoading || isFetching || updateCommonRate.isPending}
        />
      </SidebarInset>
    </>
  );
}
