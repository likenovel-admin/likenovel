"use client";

import { instance } from "@/app/api/axios";
import Button from "@/components/common/Button";
import useToastStore from "@/store/toastStore";
import { getFunnelResumeReturnPath } from "@/utils/funnelResume";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

interface VirtualAccountInfo {
  bank?: string | null;
  account_number: string;
  remittee_name?: string | null;
  expired_at?: string | null;
  issued_at?: string | null;
}

const formatVirtualAccountDeadline = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}시 ${date.getMinutes()}분까지`;
};

const PaymentRedirect = () => {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const txId = searchParams.get("txId");
  const payMethod = searchParams.get("pay_method");
  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const pgCode = searchParams.get("pgCode");
  const pgMessage = searchParams.get("pgMessage");
  const transactionType = searchParams.get("transactionType");
  const amount = searchParams.get("amount");
  const resumeReturnPath = getFunnelResumeReturnPath(searchParams);

  const [paymentStatus, setPaymentStatus] = useState("IDLE");
  const [paymentStatusText, setPaymentStatusText] =
    useState("결제가 진행중입니다.");
  const [virtualAccount, setVirtualAccount] = useState<VirtualAccountInfo | null>(
    null
  );
  const [isVirtualAccountNoticeOpen, setIsVirtualAccountNoticeOpen] = useState(true);

  const { setToast } = useToastStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handlePaymentComplete = async () => {
      const isVirtualAccount = payMethod === "VIRTUAL_ACCOUNT";

      if (code || !paymentId || (!isVirtualAccount && !txId)) {
        setPaymentStatus("FAILED");
        setPaymentStatusText(message || pgMessage || "결제를 실패했습니다.");
        setToast({
          message: message || pgMessage || "결제를 실패했습니다.",
          type: "error",
        });
        return;
      }

      if (isVirtualAccount) {
        try {
          const issuedResponse = await instance.post(
            "v1/command/payments/virtual-account/issued",
            {
              payment_id: paymentId,
            }
          );

          if (
            issuedResponse.data.payment.status === "VIRTUAL_ACCOUNT_ISSUED" &&
            issuedResponse.data.virtual_account
          ) {
            setPaymentStatus("VIRTUAL_ACCOUNT_ISSUED");
            setPaymentStatusText("가상계좌가 발급되었습니다.");
            setVirtualAccount(issuedResponse.data.virtual_account);
            setIsVirtualAccountNoticeOpen(true);
            setToast({
              message: "가상계좌가 발급되었습니다. 입금 완료 후 캐시가 충전됩니다.",
              type: "success",
            });
            return;
          }
        } catch (error) {
          console.error("virtual account complete failed:", error);
        }

        setPaymentStatus("FAILED");
        setPaymentStatusText("결제를 실패했습니다.");
        setToast({
          message: "결제를 실패했습니다.",
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
  }, [
    code,
    message,
    payMethod,
    paymentId,
    pgCode,
    pgMessage,
    queryClient,
    setToast,
    transactionType,
    txId,
  ]);

  const handleMove = () => {
    router.push(resumeReturnPath || "/");
  };

  const handleCopyVirtualAccountValue = async (
    label: string,
    value?: string | null
  ) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setToast({
        message: `${label}가 복사되었습니다.`,
        type: "success",
      });
    } catch (error) {
      console.error(`${label} 복사 실패:`, error);
      setToast({
        message: `${label} 복사에 실패했습니다.`,
        type: "error",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-16pxr">
      <h1 className="mb-4 text-center text-2xl font-bold">{paymentStatusText}</h1>
      {paymentStatus === "VIRTUAL_ACCOUNT_ISSUED" &&
        isVirtualAccountNoticeOpen &&
        virtualAccount && (
          <div className="relative mb-6 w-full max-w-[420px] rounded-[10px] border border-light-gray-300 bg-light-gray-50 p-16pxr tracking-[-2%]">
            <button
              type="button"
              className="absolute right-12pxr top-12pxr flex h-24pxr w-24pxr items-center justify-center"
              onClick={() => setIsVirtualAccountNoticeOpen(false)}
              aria-label="가상계좌 정보 닫기"
            >
              <Image src="/images/close.svg" alt="" width={16} height={16} />
            </button>
            <p className="pr-28pxr text-16pxr font-semibold text-dark-gray-700">
              가상계좌가 발급되었습니다.
            </p>
            <p className="mt-6pxr text-13pxr text-dark-gray-500">
              입금 완료 후 캐시가 충전됩니다.
            </p>
            <div className="mt-12pxr space-y-6pxr text-14pxr text-dark-gray-700">
              {amount && (
                <p className="text-16pxr font-semibold">입금금액: {Number(amount).toLocaleString()}원</p>
              )}
              <p>은행: {virtualAccount.bank || "-"}</p>
              <div className="flex items-center gap-8pxr">
                <p>계좌번호: {virtualAccount.account_number}</p>
                <button
                  type="button"
                  className="rounded-lg border border-light-gray-300 px-8pxr py-4pxr text-12pxr text-dark-gray-700"
                  onClick={() =>
                    handleCopyVirtualAccountValue(
                      "계좌번호",
                      virtualAccount.account_number
                    )
                  }
                >
                  복사
                </button>
              </div>
              <div className="flex items-center gap-8pxr">
                <p>예금주: {virtualAccount.remittee_name || "-"}</p>
                <button
                  type="button"
                  className="rounded-lg border border-light-gray-300 px-8pxr py-4pxr text-12pxr text-dark-gray-700"
                  onClick={() =>
                    handleCopyVirtualAccountValue(
                      "예금주",
                      virtualAccount.remittee_name
                    )
                  }
                >
                  복사
                </button>
              </div>
              <p>입금기한: {formatVirtualAccountDeadline(virtualAccount.expired_at)}</p>
            </div>
          </div>
      )}
      {paymentStatus === "PAID" && (
        <>
          <button
            className="my-4 w-[70%] rounded-md px-4 py-3 text-white"
            onClick={handleMove}
          >
            이동하기
          </button>
          <Button variant="primary" size="xl" className="p-3" onClick={handleMove}>
            이동하기
          </Button>
        </>
      )}
      {paymentStatus === "VIRTUAL_ACCOUNT_ISSUED" && (
        <Button variant="primary" size="xl" className="p-3" onClick={handleMove}>
          {resumeReturnPath ? "이전 페이지로" : "홈으로"}
        </Button>
      )}
      {paymentStatus === "FAILED" && (
        <Button variant="primary" size="xl" className="p-3" onClick={handleMove}>
          {resumeReturnPath ? "이전 페이지로" : "홈으로"}
        </Button>
      )}
    </div>
  );
};

export default PaymentRedirect;
