"use client";

import { formatWebsochatCashAmount } from "@/utils/websochatModelSelection";

interface Props {
  cashBalance: number;
  eventCashBalance: number;
  onCharge: () => void;
}

// 로그인 사용자의 보유 캐시와 채팅 전용 이벤트 캐시를 입력창 위에 보여준다.
// 이벤트 캐시는 메시지 비용 전액을 낼 수 있을 때 먼저 쓰이며 보유 캐시와 합산하지 않는다.
const WebsochatCashBalance = ({ cashBalance, eventCashBalance, onCharge }: Props) => {
  const hasEventCash = eventCashBalance > 0;
  return (
    <div
      role="group"
      aria-label="캐시 잔액"
      className="mb-6pxr flex min-w-0 flex-wrap items-center justify-end gap-x-10pxr gap-y-4pxr px-4pxr text-12pxr leading-[1.4]"
    >
      <span className="whitespace-nowrap text-dark-gray-400">
        보유 캐시{" "}
        <span className="font-semibold tabular-nums text-dark-gray-500">
          {formatWebsochatCashAmount(cashBalance)}C
        </span>
      </span>
      <span
        className={`whitespace-nowrap ${hasEventCash ? "text-primary-100" : "text-dark-gray-400"}`}
        title="메시지 비용 전액을 낼 수 있으면 이벤트 캐시가 먼저 쓰여요. 보유 캐시와 합쳐서 쓰지는 않아요."
      >
        이벤트 캐시{" "}
        <span className="font-semibold tabular-nums">
          {formatWebsochatCashAmount(eventCashBalance)}C
        </span>
      </span>
      <button
        type="button"
        onClick={onCharge}
        className="shrink-0 rounded-full border border-light-gray-400 bg-white px-8pxr py-2pxr text-11pxr font-medium text-dark-gray-500 hover:border-primary-100 hover:text-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-100"
      >
        충전
      </button>
    </div>
  );
};

export default WebsochatCashBalance;
