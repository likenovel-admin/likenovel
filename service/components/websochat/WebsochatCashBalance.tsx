"use client";

import { formatWebsochatCashAmount } from "@/utils/websochatModelSelection";

interface Props {
  cashBalance: number;
  eventCashBalance: number;
  onCharge: () => void;
}

// 로그인 사용자의 보유 캐시와 채팅 전용 이벤트 캐시를 입력창 위에 보여준다.
// 이벤트 캐시는 유료 캐시보다 먼저 차감된다.
const WebsochatCashBalance = ({ cashBalance, eventCashBalance, onCharge }: Props) => {
  const hasEventCash = eventCashBalance > 0;
  return (
    <div
      className="mb-6pxr flex min-w-0 items-center justify-end gap-6pxr px-4pxr text-12pxr leading-[1.4]"
      aria-label="캐시 잔액"
    >
      <span className="shrink-0 text-dark-gray-300">
        보유 캐시{" "}
        <span className="font-semibold tabular-nums text-dark-gray-500">
          {formatWebsochatCashAmount(cashBalance)}C
        </span>
      </span>
      <span aria-hidden className="h-10pxr w-px shrink-0 bg-light-gray-400" />
      <span
        className={`shrink-0 ${hasEventCash ? "text-primary-100" : "text-dark-gray-300"}`}
        title="이벤트 캐시는 웹소챗·주인공챗에서 먼저 사용돼요"
      >
        이벤트 캐시{" "}
        <span className="font-semibold tabular-nums">
          {formatWebsochatCashAmount(eventCashBalance)}C
        </span>
      </span>
      <button
        type="button"
        onClick={onCharge}
        className="ml-2pxr shrink-0 rounded-full border border-light-gray-400 bg-white px-8pxr py-2pxr text-11pxr font-medium text-dark-gray-400 hover:border-primary-100 hover:text-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-100"
      >
        충전
      </button>
    </div>
  );
};

export default WebsochatCashBalance;
