import { instance } from "@/app/api/axios";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import PortOne, { Entity } from "@portone/browser-sdk/v2";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useSelectUserInfo } from "@/app/api/query/mypage/user";
import CashHowToUse from "./CashHowToUse";
import ChargeList from "./ChargeList";
import PaymentMethod from "./PaymentMethod";

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
const CASH_CHARGE_SUCCESS_BUT_NEED_TO_CONFIRM_MESSAGE =
  "캐시를 충전했습니다. 충전 금액을 확인하세요.";

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
  const { setModal } = useModalStore();
  const queryClient = useQueryClient();
  const { data: userInfo } = useSelectUserInfo();

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
      customer: {
        fullName: userInfo?.data?.userName || userInfo?.data?.userNickname || "이용자",
        ...(userInfo?.data?.mobileNo && { phoneNumber: userInfo.data.mobileNo }),
        email: userInfo?.data?.email || "",
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_WWW_SERVER_URI}/order/payment/complete`, // (모바일)결제 완료 후 이동할 페이지
      // redirectUrl: `http://localhost:3000/order/payment/complete`,   // (모바일)결제 완료 후 이동할 페이지
      ...(payMethod === "EASY_PAY" && {
        easyPay: {
          easyPayProvider: "TOSSPAY" as Entity.EasyPayProvider,
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
        const paymentComplete = await completeResponse.data;

        // Invalidate queries to refresh user data after successful payment
        queryClient.invalidateQueries({ queryKey: ["selectUserInfo"] });
        queryClient.invalidateQueries({ queryKey: ["selectUserCash"] });

        setPaymentStatus({
          status:
            paymentComplete?.payment?.status ?? "SUCCESS_BUT_NEED_TO_CONFIRM",
        });
      } else {
        // console.log("paymentComplete_response_not_ok:", await completeResponse.text())
        setPaymentStatus({
          status: "FAILED",
          // message: await completeResponse.text(),
          message: "결제를 실패했습니다.",
        });
      }
      handleOpenModal(e);
    }
  };

  const isWaitingPayment = paymentStatus.status !== "IDLE";

  const handleClose = () =>
    setPaymentStatus({
      status: "IDLE", //결제 최초 상태
    });

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();

    // const handleConfirm = async () => {
    //   try {
    if (paymentStatus.status === "FAILED") {
      setToast({
        message: CASH_CHARGE_FAILED_MESSAGE,
        type: "error",
      });
    } else {
      if (paymentStatus.status === "SUCCESS_BUT_NEED_TO_CONFIRM") {
        setToast({
          message: CASH_CHARGE_SUCCESS_BUT_NEED_TO_CONFIRM_MESSAGE,
          type: "success",
        });
      } else {
        setToast({
          message: CASH_CHARGE_SUCCESS_MESSAGE,
          type: "success",
        });
      }
    }
    // } catch (error) {}
    // };

    // setModal(
    //   <WarningModal
    //     content={
    //       <span className="text-17pxr font-bold">결제가 완료되었습니다</span>
    //     }
    //     onConfirm={handleConfirm}
    //   />
    // );
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
