import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { useState } from "react";
import ReactDatePicker from "react-datepicker";
import { useAcceptAppliedPromotion } from "../../../../api/appliedPromotion/index";
import { IAppliedPromotion } from "@/types/appliedPromotion";

interface DocumentsPopupProps {
  close: () => void;
  refetch: () => void;
  data: IAppliedPromotion | null;
}

const AcceptPopup = (props: DocumentsPopupProps) => {
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const acceptAppliedPromotion = useAcceptAppliedPromotion();

  const handleSave = async () => {
    if (acceptAppliedPromotion.isPending) return;

    if (!endDate) {
      showAlert("알림", "종료일을 선택해주세요.", "확인");
      return;
    }

    acceptAppliedPromotion.mutate(
      {
        id: props.data?.id + "" || "",
        body: {
          end_date: endDate.toISOString().split("T")[0],
        },
      },
      {
        onSuccess: () => {
          props.close();
          props.refetch();
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  return (
    <div className="documents-popup-wrapper">
      <div className="documents-popup shadow">
        <div className="documents-popup-main">
          <h1>프로모션 승인</h1>
          <Table classNameWrap="static">
            <TableBody>
              <TableRow>
                <TableHead>종료일</TableHead>
                <TableCell>
                  <ReactDatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date ?? undefined)}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="종료일"
                    className="border px-3 py-2 rounded text-sm w-[140px]"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div className="documents-popup-buttons">
            <Button variant="outline" onClick={handleSave}>
              생성
            </Button>
            <Button variant="outline" onClick={props.close}>
              취소
            </Button>
          </div>
        </div>
      </div>
      <FullPageLoader isLoading={acceptAppliedPromotion.isPending} />
    </div>
  );
};

export { AcceptPopup };
