import { instance } from "@/app/api/axios";
import useToastStore from "@/store/toastStore";
import {
  appendExistingFunnelResumeToPath,
  getFunnelResumeParamFromSearchParams,
  getFunnelResumeReturnPath,
} from "@/utils/funnelResume";
import PortOne, { Entity } from "@portone/browser-sdk/v2";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSelectUserInfo } from "@/app/api/query/mypage/user";
import CashHowToUse from "./CashHowToUse";
import ChargeList from "./ChargeList";
import PaymentMethod from "./PaymentMethod";
import { useRouter, useSearchParams } from "next/navigation";

interface Item {
  name: string;
  price: number;
  id: string;
  currency: Currency;
}

type Currency = "KRW";
type Gender = "MALE" | "FEMALE" | "UNKNOWN";

const CASH_CHARGE_LOADING_MESSAGE = "결제 정보를 불러오는 중입니다.";
const CASH_CHARGE_STOP_MESSAGE = "캐시충전을 중지했습니다.";
const CASH_CHARGE_FAILED_MESSAGE = "캐시충전 결제를 실패했습니다.";
const CASH_CHARGE_SUCCESS_MESSAGE = "캐시를 충전했습니다.";

/*
<고객 정보>
fullName string
구매자 전체 이름
이니시스의 경우 fullName 혹은 (firstName + lastName)을 필수로 입력해야 합니다.

firstName string
구매자 이름
이니시스의 경우 fullName 혹은 (firstName + lastName)을 필수로 입력해야 합니다.

lastName string
구매자 성
이니시스의 경우 fullName 혹은 (firstName + lastName)을 필수로 입력해야 합니다.

phoneNumber string
구매자 연락처
이니시스의 PC 결제의 경우 필수로 입력해야 합니다. (모바일인 경우에는 optional)

email string
구매자 이메일 : 이니시스의 PC 결제의 경우 필수로 입력해야 합니다. (모바일인 경우에는 optional)
*/

const CashCharge = () => {
  const [item, setItem] = useState<Item>({
    id: "1",
    name: "CASH-30000",
    price: 30000,
    currency: "KRW" as Currency,
  });

  const [payMethod, setPayMethod] = useState<string>("CARD");
  const [paymentStatus, setPaymentStatus] = useState<{
    status: string;
    message?: string;
  }>({
    status: "IDLE",
  });

  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const { data: userInfo } = useSelectUserInfo();
  const router = useRouter();
  const searchParams = useSearchParams();
  const encodedResume = getFunnelResumeParamFromSearchParams(searchParams);
  const resumeReturnPath = getFunnelResumeReturnPath(searchParams);

  // useEffect(() => {
  //   async function loadItem() {
  //     //const response = await fetch("/api/item")
  //     setItem({
  //       id: "0",
  //       name: `캐시-${item.price}`,
  //       price: item.price,
  //     })
  //   }

  //   loadItem().catch((error) => console.error(error))
  // }, [])

  if (item == null) {
    return (
      <dialog open>
        <article aria-busy>{CASH_CHARGE_LOADING_MESSAGE}</article>
      </dialog>
    );
  }

  const randomId = () => {
    const array = crypto.getRandomValues(new Uint32Array(2));
    return Array.from(array)
      .map((word) => word.toString(16).padStart(8, "0"))
      .join("");
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPaymentStatus({ status: "PENDING" });

    const paymentId = randomId();

    const payment = await PortOne.requestPayment({
      storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "",
      channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? "",
      paymentId,
      orderName: item.name,
      totalAmount: item.price,
      taxFreeAmount: 0,
      currency: "CURRENCY_KRW",
      payMethod: payMethod as Entity.PayMethod,
      customData: {
        item: { id: item.id, name: item.name, price: item.price },
      },
      customer: process.env.NEXT_PUBLIC_WWW_SERVER_URI?.includes("likenovel.net")
        ? {
            fullName: userInfo?.data?.userName || userInfo?.data?.userNickname || "이용자",
            phoneNumber: userInfo?.data?.mobileNo || "070-5157-3000",
            email: userInfo?.data?.email || "admin@likenovel.net",
          }
        : {
            fullName: "테스트",
            phoneNumber: "010-0000-0000",
            email: "test@test.com",
          },
      redirectUrl: appendExistingFunnelResumeToPath(
        `${process.env.NEXT_PUBLIC_WWW_SERVER_URI}/order/payment/complete`,
        encodedResume
      ), // (모바일)결제 완료 후 이동할 페이지
      // redirectUrl: `http://localhost:3000/order/payment/complete`,   // (모바일)결제 완료 후 이동할 페이지
      ...((payMethod === "KAKAOPAY" || payMethod === "TOSSPAY") && {
        payMethod: "EASY_PAY" as Entity.PayMethod,
        easyPay: {
          easyPayProvider: payMethod as Entity.EasyPayProvider,
          availablePayMethods: ["CARD"] as Entity.EasyPayPaymentMethod[],
        },
      }),
      ...(payMethod === "MOBILE" && {
        productType: "DIGITAL" as Entity.ProductType, //모바일 결제 시 필수
      }),
      ...(payMethod === "VIRTUAL_ACCOUNT" && {
        virtualAccount: {
          //가상계좌 결제 시 필수
          accountExpiry: {
            validHours: 72,
          },
        },
      }),
    });

    if (payment && payment.code !== undefined) {
      // 결제 중지 토스트 메시지 출력
      setToast({
        message: CASH_CHARGE_STOP_MESSAGE,
        type: "error",
      });

      // 결제 실패 상태 업데이트
      setPaymentStatus({
        status: "FAILED",
        message: CASH_CHARGE_STOP_MESSAGE,
      });

      return;
    } else {
      // 결제 완료 처리
      console.log("payment_response:", payment);
      const completeResponse = await instance.post(
        `${process.env.NEXT_PUBLIC_API_SERVER_URI}/v1/command/orders/complete`,
        {
          payment_id: payment?.paymentId,
          tx_id: payment?.txId,
        }
      );

      console.log("completeResponse:", completeResponse);

      if (completeResponse?.data?.payment?.status === "PAID") {
        // Invalidate queries to refresh user data after successful payment
        queryClient.invalidateQueries({ queryKey: ["selectUserInfo"] });
        queryClient.invalidateQueries({ queryKey: ["selectUserCash"] });

        setPaymentStatus({ status: "PAID" });
        setToast({
          message: CASH_CHARGE_SUCCESS_MESSAGE,
          type: "success",
        });

        if (resumeReturnPath) {
          router.push(resumeReturnPath, { scroll: false });
          return;
        }
      } else {
        setPaymentStatus({
          status: "FAILED",
          message: "결제를 실패했습니다.",
        });
        setToast({
          message: CASH_CHARGE_FAILED_MESSAGE,
          type: "error",
        });
      }
    }
  };

  return (
    <div className="w-full">
      <ChargeList item={item} onSetItem={setItem} />
      <PaymentMethod payMethod={payMethod} onSetPayMethod={setPayMethod} />
      <button
        className="w-full bg-black text-white rounded-md px-4 py-3 my-4"
        onClick={handleSubmit}
      >
        결제하기
      </button>
      <CashHowToUse />
    </div>
  );
};

export default CashCharge;
