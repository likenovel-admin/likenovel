import {
  useGetMonthlySaleByProductDetail,
  useUpdateMonthlySaleByProduct,
} from "@/api/monthly-sales-by-product";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { useEffect, useState } from "react";

interface SalesPopupProps {
  productId: string;
  close: () => void;
}

const SalesPopup = (props: SalesPopupProps) => {
  const { data } = useGetMonthlySaleByProductDetail(props.productId || "");
  const update = useUpdateMonthlySaleByProduct();

  const [sumSettlementPriceWeb, setSumSettlementPriceWeb] = useState<number>();
  const [sumSettlementCompedTicketPrice, setSumSettlementCompedTicketPrice] =
    useState<number>();
  const [taxPrice, setTaxPrice] = useState<number>();
  const [totalPrice, setTotalPrice] = useState<number>();

  useEffect(() => {
    if (data) {
      const { summary } = data;
      setSumSettlementPriceWeb(summary.paid_price);
      setSumSettlementCompedTicketPrice(summary.free_price);
      setTaxPrice(summary.tax_price);
      setTotalPrice(summary.total_price);
    }
  }, [data]);

  const handleSubmit = async () => {
    if (update.isPending) return;

    update.mutate(
      {
        id: (props.productId || "") + "",
        body: {
          sum_settlement_price_web: sumSettlementPriceWeb || 0,
          sum_settlement_comped_ticket_price:
            sumSettlementCompedTicketPrice || 0,
          tax_price: taxPrice || 0,
          // settlement_rate: totalPrice || 0,
          // fee: totalPrice || 0,
        },
      },
      {
        onSuccess: () => props.close(),
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  return (
    <div className="sales-popup-wrapper">
      <div className="sales-popup shadow">
        <div className="sales-popup-main">
          <h1>매출 정보</h1>
          <Table>
            <TableRow>
              <TableHead></TableHead>
              <TableHead className="border-l">웹</TableHead>
              <TableHead className="border-l">PlayStore</TableHead>
              <TableHead className="border-l">iOS</TableHead>
              <TableHead className="border-l">OneStore</TableHead>
              <TableHead className="border-l">무상 대여권</TableHead>
            </TableRow>

            <TableRow>
              <TableHead>일반 구매</TableHead>
              <TableCell className="border-l">
                {data?.result?.sum_normal_price_web || "" || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.sum_normal_price_playstore || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.sum_normal_price_ios || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.sum_normal_price_onestore || ""}
              </TableCell>
              <TableCell className="border-l">-</TableCell>
            </TableRow>

            <TableRow>
              <TableHead>대여권</TableHead>
              <TableCell className="border-l">
                {data?.result?.sum_ticket_price_web || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.sum_ticket_price_playstore || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.sum_ticket_price_ios || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.sum_ticket_price_onestore || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.sum_comped_ticket_price || ""}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableHead>결제 수수료</TableHead>
              <TableCell className="border-l">
                {data?.result?.fee_web || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.fee_playstore || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.fee_ios || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.fee_onestore || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.fee_comped_ticket || ""}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableHead>취소액</TableHead>
              <TableCell className="border-l">
                {data?.result?.sum_refund_price_web || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.sum_refund_price_playstore || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.sum_refund_price_ios || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.sum_refund_price_onestore || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.sum_refund_comped_ticket_price || ""}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableHead>정산율(%)</TableHead>
              <TableCell className="border-l">
                {data?.result?.settlement_rate_web || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.settlement_rate_playstore || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.settlement_rate_ios || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.settlement_rate_onestore || ""}
              </TableCell>
              <TableCell className="border-l">
                {data?.result?.settlement_rate_comped_ticket || ""}
              </TableCell>
            </TableRow>
          </Table>
          <Table>
            <TableRow className="border-0">
              <TableHead></TableHead>
              <TableHead>유상</TableHead>
              <TableHead>무상</TableHead>
              <TableHead>전체</TableHead>
              <TableHead></TableHead>
            </TableRow>
            <TableRow className="border-0">
              <TableCell>정산액</TableCell>
              <TableCell>
                <Input
                  readOnly
                  type="number"
                  step="any"
                  value={sumSettlementPriceWeb}
                  onChange={(e) =>
                    setSumSettlementPriceWeb(Number(e.target.value))
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  readOnly
                  type="number"
                  step={"any"}
                  value={sumSettlementCompedTicketPrice}
                  onChange={(e) =>
                    setSumSettlementCompedTicketPrice(Number(e.target.value))
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={
                    (sumSettlementPriceWeb || 0) +
                    (sumSettlementCompedTicketPrice || 0)
                  }
                  readOnly
                />
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow className="border-0">
              <TableCell>세액</TableCell>
              <TableCell>
                <Input
                  readOnly
                  type="number"
                  step="any"
                  value={taxPrice}
                  onChange={(e) => setTaxPrice(Number(e.target.value))}
                />
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
            </TableRow>
            <TableRow className="border-0">
              <TableCell>합계</TableCell>
              <TableCell>
                <Input
                  type="number"
                  step={"any"}
                  value={
                    (sumSettlementPriceWeb || 0) +
                    (sumSettlementCompedTicketPrice || 0) -
                    (taxPrice || 0)
                  }
                  readOnly
                />
              </TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
              <TableCell></TableCell>
            </TableRow>
          </Table>
          <div className="sales-popup-buttons">
            <Button variant="outline" onClick={handleSubmit}>
              확인
            </Button>
            <Button onClick={props.close}>취소</Button>
          </div>
        </div>
      </div>
      <FullPageLoader isLoading={update.isPending} />
    </div>
  );
};

interface ManageSalesPopupProps {
  productId: string;
  close: () => void;
}

const ManageSalesPopup = (props: ManageSalesPopupProps) => {
  const { data } = useGetMonthlySaleByProductDetail(props.productId || "");
  const update = useUpdateMonthlySaleByProduct();

  const [settlementRate, setSettlementRate] = useState<number>();
  const [taxPrice, setTaxPrice] = useState<number>();
  const [fee, setFee] = useState<number>();

  useEffect(() => {
    if (data) {
      setSettlementRate(data?.result?.settlement_rate_playstore || 70);
      setTaxPrice(data?.result?.tax_price);
      setFee(data?.result?.fee_playstore);
    }
  }, [data]);

  const handleSubmit = async () => {
    if (update.isPending) return;

    update.mutate(
      {
        id: (props.productId || "") + "",
        body: {
          tax_price: taxPrice || 0,
          settlement_rate: settlementRate || 0,
          fee: fee || 0,
        },
      },
      {
        onSuccess: () => props.close(),
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };
  return (
    <div className="sales-popup-wrapper">
      <div className="sales-popup shadow">
        <div className="sales-popup-main">
          <h1>매출 관리</h1>
          <Table>
            <TableRow className="border-0">
              <TableCell>정산율</TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="any"
                  max="100"
                  value={settlementRate ?? ""}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setSettlementRate(value > 100 ? 100 : value);
                  }}
                />
              </TableCell>
            </TableRow>
            <TableRow className="border-0">
              <TableCell>결제 수수료</TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="any"
                  value={fee ?? ""}
                  onChange={(e) => setFee(Number(e.target.value))}
                />
              </TableCell>
            </TableRow>
            <TableRow className="border-0">
              <TableCell>세액</TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="any"
                  value={taxPrice ?? ""}
                  onChange={(e) => setTaxPrice(Number(e.target.value))}
                />
              </TableCell>
            </TableRow>
          </Table>
          <div className="sales-popup-buttons">
            <Button variant="outline" onClick={handleSubmit}>
              설정
            </Button>
            <Button onClick={props.close}>취소</Button>
          </div>
        </div>
      </div>
      <FullPageLoader isLoading={update.isPending} />
    </div>
  );
};

export { SalesPopup, ManageSalesPopup };
