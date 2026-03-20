import { instance } from "@/app/api/axios";
import useToastStore from "@/store/toastStore";
import useAuthStore from "@/store/authStore";
import useConfirmStore from "@/store/confirmStore";
import {
  appendExistingFunnelResumeToPath,
  getFunnelResumeParamFromSearchParams,
  getFunnelResumeReturnPath,
} from "@/utils/funnelResume";
import PortOne, { Entity } from "@portone/browser-sdk/v2";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSelectUserInfo } from "@/app/api/query/mypage/user";
import CashHowToUse from "./CashHowToUse";
import ChargeList from "./ChargeList";
import PaymentMethod from "./PaymentMethod";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

interface Item {
  name: string;
  price: number;
  id: string;
  currency: Currency;
}

type Currency = "KRW";
type Gender = "MALE" | "FEMALE" | "UNKNOWN";

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

const CASH_CHARGE_LOADING_MESSAGE = "결제 정보를 불러오는 중입니다.";
const CASH_CHARGE_STOP_MESSAGE = "캐시충전을 중지했습니다.";
const CASH_CHARGE_FAILED_MESSAGE = "캐시충전 결제를 실패했습니다.";
const CASH_CHARGE_SUCCESS_MESSAGE = "캐시를 충전했습니다.";
const VIRTUAL_ACCOUNT_STORAGE_KEY_PREFIX = "virtual-account-pending";
const VIRTUAL_ACCOUNT_STORAGE_TTL_MS = 72 * 60 * 60 * 1000;

interface PendingVirtualAccountStorage {
  paymentId: string;
  userId: number;
  payMethod: "VIRTUAL_ACCOUNT";
  createdAt: number;
}

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
    virtualAccount?: VirtualAccountInfo;
  }>({
    status: "IDLE",
  });
  const [isVirtualAccountNoticeOpen, setIsVirtualAccountNoticeOpen] = useState(true);

  const { setToast } = useToastStore();
  const { setConfirm } = useConfirmStore();
  const queryClient = useQueryClient();
  const { data: userInfo } = useSelectUserInfo();
  const { user } = useAuthStore((state) => ({ user: state.user }));
  const router = useRouter();
  const searchParams = useSearchParams();
  const encodedResume = getFunnelResumeParamFromSearchParams(searchParams);
  const resumeReturnPath = getFunnelResumeReturnPath(searchParams);

  const getVirtualAccountStorageKey = () => {
    if (!user?.userId) {
      return null;
    }

    return `${VIRTUAL_ACCOUNT_STORAGE_KEY_PREFIX}:${user.userId}`;
  };

  const savePendingVirtualAccount = (paymentId: string) => {
    const key = getVirtualAccountStorageKey();
    if (!key || !user?.userId) {
      return;
    }

    const payload: PendingVirtualAccountStorage = {
      paymentId,
      userId: user.userId,
      payMethod: "VIRTUAL_ACCOUNT",
      createdAt: Date.now(),
    };

    sessionStorage.setItem(key, JSON.stringify(payload));
  };

  const loadPendingVirtualAccount = (): PendingVirtualAccountStorage | null => {
    const key = getVirtualAccountStorageKey();
    if (!key || !user?.userId) {
      return null;
    }

    const raw = sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as PendingVirtualAccountStorage;
      if (
        parsed.payMethod !== "VIRTUAL_ACCOUNT" ||
        parsed.userId !== user.userId ||
        !parsed.paymentId ||
        Date.now() - parsed.createdAt > VIRTUAL_ACCOUNT_STORAGE_TTL_MS
      ) {
        sessionStorage.removeItem(key);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error("pending virtual account storage parse failed:", error);
      sessionStorage.removeItem(key);
      return null;
    }
  };

  const clearPendingVirtualAccount = () => {
    const key = getVirtualAccountStorageKey();
    if (!key) {
      return;
    }

    sessionStorage.removeItem(key);
  };

  useEffect(() => {
    const restorePendingVirtualAccount = async () => {
      const pending = loadPendingVirtualAccount();
      if (!pending) {
        return;
      }

      try {
        const verifyResponse = await instance.post(
          "v1/command/payments/verify-virtual-account",
          {
            payment_id: pending.paymentId,
          }
        );

        if (
          verifyResponse?.data?.payment?.status === "VIRTUAL_ACCOUNT_ISSUED" &&
          verifyResponse?.data?.virtual_account
        ) {
          setPaymentStatus({
            status: "VIRTUAL_ACCOUNT_ISSUED",
            message: "가상계좌가 발급되었습니다.",
            virtualAccount: verifyResponse.data.virtual_account,
          });
          setIsVirtualAccountNoticeOpen(true);
          return;
        }

        if (verifyResponse?.data?.payment?.status === "PAID") {
          clearPendingVirtualAccount();
          queryClient.invalidateQueries({ queryKey: ["selectUserInfo"] });
          queryClient.invalidateQueries({ queryKey: ["selectUserCash"] });
          setPaymentStatus({ status: "PAID" });
          return;
        }

        clearPendingVirtualAccount();
        return;
      } catch (error) {
        console.error("restore virtual account failed:", error);
      }
    };

    restorePendingVirtualAccount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, user?.userId]);

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

  const buildPaymentRedirectUrl = () => {
    const baseUrl = appendExistingFunnelResumeToPath(
      `${process.env.NEXT_PUBLIC_WWW_SERVER_URI}/order/payment/complete`,
      encodedResume
    );

    if (payMethod !== "VIRTUAL_ACCOUNT") {
      return baseUrl;
    }

    const redirectUrl = new URL(
      baseUrl,
      process.env.NEXT_PUBLIC_WWW_SERVER_URI ?? window.location.origin
    );
    redirectUrl.searchParams.set("pay_method", "VIRTUAL_ACCOUNT");
    return redirectUrl.toString();
  };

  const buildVirtualAccountNoticeUrls = () => {
    const apiServerUri = process.env.NEXT_PUBLIC_API_SERVER_URI;
    if (
      !apiServerUri ||
      apiServerUri.includes("localhost") ||
      apiServerUri.includes("host.docker.internal")
    ) {
      return undefined;
    }

    return [`${apiServerUri}/v1/command/payments/webhook`];
  };

  const showPendingVirtualAccountNotice = (
    pendingPaymentId: string,
    virtualAccount: VirtualAccountInfo
  ) => {
    savePendingVirtualAccount(pendingPaymentId);
    setConfirm({
      content: "이미 발급된 가상계좌가 있습니다.",
      confirmText: "확인",
      buttonCount: 1,
      onConfirm: () => {
        setPayMethod("VIRTUAL_ACCOUNT");
        setPaymentStatus({
          status: "VIRTUAL_ACCOUNT_ISSUED",
          message: "가상계좌가 발급되었습니다.",
          virtualAccount,
        });
        setIsVirtualAccountNoticeOpen(true);
      },
    });
  };

  const handleSetPaymentMethod = async (method: string) => {
    if (method !== "VIRTUAL_ACCOUNT") {
      setPayMethod(method);
      return;
    }

    try {
      const response = await instance.get(
        "/v1/query/payments/virtual-account/pending"
      );

      if (
        response?.data?.has_pending &&
        response?.data?.payment?.status === "VIRTUAL_ACCOUNT_ISSUED" &&
        response?.data?.payment?.payment_id &&
        response?.data?.virtual_account
      ) {
        showPendingVirtualAccountNotice(
          response.data.payment.payment_id,
          response.data.virtual_account
        );
        return;
      }

      if (response?.data?.payment?.status === "PAID") {
        clearPendingVirtualAccount();
        queryClient.invalidateQueries({ queryKey: ["selectUserInfo"] });
        queryClient.invalidateQueries({ queryKey: ["selectUserCash"] });
      }
    } catch (error) {
      console.error("active virtual account pending lookup failed:", error);
    }

    setPayMethod("VIRTUAL_ACCOUNT");
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setPaymentStatus({ status: "PENDING" });

    const paymentId = randomId();
    const virtualAccountNoticeUrls =
      payMethod === "VIRTUAL_ACCOUNT" ? buildVirtualAccountNoticeUrls() : undefined;

    if (payMethod === "VIRTUAL_ACCOUNT" && !user?.userId) {
      setPaymentStatus({
        status: "FAILED",
        message: CASH_CHARGE_FAILED_MESSAGE,
      });
      setToast({
        message: CASH_CHARGE_FAILED_MESSAGE,
        type: "error",
      });
      return;
    }

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
        ...(payMethod === "VIRTUAL_ACCOUNT" && user?.userId
          ? { user_id: user.userId }
          : {}),
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
      redirectUrl: buildPaymentRedirectUrl(), // (모바일)결제 완료 후 이동할 페이지
      // redirectUrl: `http://localhost:3000/order/payment/complete`,   // (모바일)결제 완료 후 이동할 페이지
      ...(payMethod === "KAKAOPAY" && {
        payMethod: "EASY_PAY" as Entity.PayMethod,
        easyPay: {
          easyPayProvider: "KAKAOPAY" as Entity.EasyPayProvider,
          availablePayMethods: ["CARD"] as Entity.EasyPayPaymentMethod[],
        },
      }),
      ...(payMethod === "NAVERPAY" && {
        payMethod: "EASY_PAY" as Entity.PayMethod,
        easyPay: {
          easyPayProvider: "NAVERPAY" as Entity.EasyPayProvider,
          availablePayMethods: ["CARD"] as Entity.EasyPayPaymentMethod[],
        },
      }),
      ...(payMethod === "MOBILE" && {
        productType: "DIGITAL" as Entity.ProductType, //모바일 결제 시 필수
      }),
      ...(virtualAccountNoticeUrls && {
        noticeUrls: virtualAccountNoticeUrls,
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
      console.error("PortOne payment error:", payment.code, payment.message);
      const errorMsg = payment.message || CASH_CHARGE_STOP_MESSAGE;
      setToast({
        message: errorMsg,
        type: "error",
      });

      setPaymentStatus({
        status: "FAILED",
        message: errorMsg,
      });

      return;
    } else {
      if (payMethod === "VIRTUAL_ACCOUNT") {
        try {
          const issuedPaymentId = payment?.paymentId;
          if (!issuedPaymentId) {
            throw new Error("missing paymentId");
          }

          const issuedResponse = await instance.post(
            "v1/command/payments/virtual-account/issued",
            {
              payment_id: issuedPaymentId,
            }
          );

          if (
            issuedResponse?.data?.payment?.status === "VIRTUAL_ACCOUNT_ISSUED" &&
            issuedResponse?.data?.virtual_account
          ) {
            savePendingVirtualAccount(issuedPaymentId);
            setPaymentStatus({
              status: "VIRTUAL_ACCOUNT_ISSUED",
              message: "가상계좌가 발급되었습니다.",
              virtualAccount: issuedResponse.data.virtual_account,
            });
            setIsVirtualAccountNoticeOpen(true);
            setToast({
              message: "가상계좌가 발급되었습니다. 입금 완료 후 캐시가 충전됩니다.",
              type: "success",
            });
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
        } catch (error) {
          console.error("virtual account issued failed:", error);
          setPaymentStatus({
            status: "FAILED",
            message: "결제를 실패했습니다.",
          });
          setToast({
            message: CASH_CHARGE_FAILED_MESSAGE,
            type: "error",
          });
        }
        return;
      }

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
    <div className="w-full">
      <ChargeList item={item} onSetItem={setItem} />
      <PaymentMethod payMethod={payMethod} onSetPayMethod={handleSetPaymentMethod} />
      <button
        className="w-full bg-black text-white rounded-md px-4 py-3 my-4"
        onClick={handleSubmit}
      >
        결제하기
      </button>
      {paymentStatus.status === "VIRTUAL_ACCOUNT_ISSUED" &&
        isVirtualAccountNoticeOpen &&
        paymentStatus.virtualAccount && (
          <div className="relative mb-16pxr rounded-[10px] border border-light-gray-300 bg-light-gray-50 p-16pxr tracking-[-2%]">
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
              <p>은행: {paymentStatus.virtualAccount.bank || "-"}</p>
              <div className="flex items-center gap-8pxr">
                <p>계좌번호: {paymentStatus.virtualAccount.account_number}</p>
                <button
                  type="button"
                  className="rounded-lg border border-light-gray-300 px-8pxr py-4pxr text-12pxr text-dark-gray-700"
                  onClick={() =>
                    handleCopyVirtualAccountValue(
                      "계좌번호",
                      paymentStatus.virtualAccount?.account_number
                    )
                  }
                >
                  복사
                </button>
              </div>
              <div className="flex items-center gap-8pxr">
                <p>예금주: {paymentStatus.virtualAccount.remittee_name || "-"}</p>
                <button
                  type="button"
                  className="rounded-lg border border-light-gray-300 px-8pxr py-4pxr text-12pxr text-dark-gray-700"
                  onClick={() =>
                    handleCopyVirtualAccountValue(
                      "예금주",
                      paymentStatus.virtualAccount?.remittee_name
                    )
                  }
                >
                  복사
                </button>
              </div>
              <p>
                입금기한:{" "}
                {formatVirtualAccountDeadline(paymentStatus.virtualAccount.expired_at)}
              </p>
            </div>
          </div>
        )}
      <CashHowToUse />
    </div>
  );
};

export default CashCharge;
