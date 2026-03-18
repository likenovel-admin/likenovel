"use client";

import { instance } from "@/app/api/axios";
import Button from "@/components/common/Button";
import useToastStore from "@/store/toastStore";
import { getFunnelResumeReturnPath } from "@/utils/funnelResume";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const PaymentRedirect = () => {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const txId = searchParams.get("txId");
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const pgCode = searchParams.get("pgCode");
  const pgMessage = searchParams.get("pgMessage");
  const transactionType = searchParams.get("transactionType");
  const resumeReturnPath = getFunnelResumeReturnPath(searchParams);

  const [paymentStatus, setPaymentStatus] = useState("IDLE");
  const [paymentStatusText, setPaymentStatusText] =
    useState("결제가 진행중입니다.");

  const { setToast } = useToastStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handlePaymentComplete = async () => {
      if (code || !paymentId || !txId) {
        setPaymentStatus("FAILED");
        setPaymentStatusText(message || pgMessage || "결제를 실패했습니다.");
        setToast({
          message: message || pgMessage || "결제를 실패했습니다.",
          type: "error",
        });
        return;
      }

      const response = await instance.post(
        `${process.env.NEXT_PUBLIC_API_SERVER_URI}/v1/command/orders/complete`,
        {
          payment_id: paymentId,
          tx_id: txId,
        }
      );

      if (response.data.payment.status === "PAID") {
        setPaymentStatus("PAID");
        setPaymentStatusText("결제가 완료되었습니다.");

        // Invalidate queries to refresh user data after successful payment
        queryClient.invalidateQueries({ queryKey: ["selectUserInfo"] });
        queryClient.invalidateQueries({ queryKey: ["selectUserCash"] });

        setToast({
          message: "결제가 완료되었습니다.",
          type: "success",
        });
      } else {
        setPaymentStatus("FAILED");
        setPaymentStatusText("결제를 실패했습니다.");

        setToast({
          message: "결제를 실패했습니다.",
          type: "error",
        });
      }
    };

    handlePaymentComplete();
  }, [code, message, paymentId, pgMessage, queryClient, setToast, txId]);

  const handlePaymentComplete = () => {
    router.push(resumeReturnPath || "/");
  };

  const handlePaymentFailure = () => {
    router.push(resumeReturnPath || "/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">{paymentStatusText}</h1>
      {paymentStatus === "PAID" && (
        <>
          <button
            className="w-[70%] bg- text-white rounded-md px-4 py-3 my-4"
            onClick={handlePaymentComplete}
          >
            이동하기
          </button>
          <Button
            variant="primary"
            size="xl"
            className="p-3"
            onClick={handlePaymentComplete}
          >
            이동하기
          </Button>
          {/* <div className="text-gray-600">
            <p>결제 ID: {paymentId}</p>
            <p>거래 ID: {txId}</p>
            <p>코드: {code}</p>
            <p>메시지: {message}</p>
            <p>PG 코드: {pgCode}</p>
            <p>PG 메시지: {pgMessage}</p>
            <p>거래 유형: {transactionType}</p>
          </div> */}
        </>
      )}
      {paymentStatus === "FAILED" && (
        <Button
          variant="primary"
          size="xl"
          className="p-3"
          onClick={handlePaymentFailure}
        >
          {resumeReturnPath ? "이전 페이지로" : "홈으로"}
        </Button>
      )}
    </div>
  );
};

export default PaymentRedirect;
