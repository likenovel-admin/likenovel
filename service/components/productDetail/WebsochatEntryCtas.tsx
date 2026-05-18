"use client";

import { savePendingWebsochatLaunch } from "@/utils/websochatLaunch";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

type WebsochatEntryCtaSpec = {
  key: string;
  actionCopy: string;
  action: {
    label: string;
    prompt: string;
    modeKey?: "qa" | "rp" | "ideal_worldcup" | null;
    qaActionKey?: "predict" | "next_episode_write" | null;
  };
};

export const WEBSOCHAT_ENTRY_CTA_POOL: WebsochatEntryCtaSpec[] = [
  {
    key: "chat-freestyle",
    actionCopy: "수다떨기",
    action: {
      label: "작품 대화",
      prompt: "이 작품에 대해 뭐든 편하게 이야기해줘",
      modeKey: "qa",
      qaActionKey: null,
    },
  },
  {
    key: "chat-main-character",
    actionCopy: "주인공이랑 대화하기",
    action: {
      label: "인물과 대화",
      prompt: "인물과 대화하고 싶어",
      modeKey: "rp",
      qaActionKey: null,
    },
  },
  {
    key: "chat-side-character",
    actionCopy: "캐릭터랑 대화하기",
    action: {
      label: "인물과 대화",
      prompt: "다른 인물과도 대화해보고 싶어",
      modeKey: "rp",
      qaActionKey: null,
    },
  },
  {
    key: "predict-next",
    actionCopy: "다음 전개 예상하기",
    action: {
      label: "다음 전개 예상",
      prompt: "다음 전개를 예상해줘",
      modeKey: "qa",
      qaActionKey: "predict",
    },
  },
  {
    key: "write-next-episode",
    actionCopy: "다음회차 생성하기",
    action: {
      label: "다음회차 생성",
      prompt: "다음회차 써줘",
      modeKey: "qa",
      qaActionKey: "next_episode_write",
    },
  },
  {
    key: "world-building",
    actionCopy: "세계관 파보기",
    action: {
      label: "작품 대화",
      prompt: "이 작품 세계관과 설정을 깊게 파봐",
      modeKey: "qa",
      qaActionKey: null,
    },
  },
  {
    key: "setting-play",
    actionCopy: "설정 놀음하기",
    action: {
      label: "작품 대화",
      prompt: "이 작품 설정으로 이것저것 놀아보자",
      modeKey: "qa",
      qaActionKey: null,
    },
  },
  {
    key: "relationships",
    actionCopy: "인물 관계 물어보기",
    action: {
      label: "작품 대화",
      prompt: "이 작품 인물 관계를 같이 뜯어보자",
      modeKey: "qa",
      qaActionKey: null,
    },
  },
  {
    key: "best-scene",
    actionCopy: "명장면 같이 떠들기",
    action: {
      label: "작품 대화",
      prompt: "이 작품 명장면을 같이 떠들어보자",
      modeKey: "qa",
      qaActionKey: null,
    },
  },
  {
    key: "character-ranking",
    actionCopy: "누가 제일 매력적인지 따져보기",
    action: {
      label: "작품 대화",
      prompt: "이 작품에서 누가 제일 매력적인지 같이 따져보자",
      modeKey: "qa",
      qaActionKey: null,
    },
  },
  {
    key: "villain-view",
    actionCopy: "악역 시점으로 보기",
    action: {
      label: "작품 대화",
      prompt: "이 작품을 악역 시점으로 풀어보자",
      modeKey: "qa",
      qaActionKey: null,
    },
  },
  {
    key: "power-scaling",
    actionCopy: "전투력·능력 비교하기",
    action: {
      label: "작품 대화",
      prompt: "이 작품 전투력과 능력 구도를 비교해보자",
      modeKey: "qa",
      qaActionKey: null,
    },
  },
  {
    key: "teaser-hunt",
    actionCopy: "가장 수상한 떡밥 찾기",
    action: {
      label: "작품 대화",
      prompt: "이 작품에서 가장 수상한 떡밥을 같이 찾아보자",
      modeKey: "qa",
      qaActionKey: null,
    },
  },
  {
    key: "entry-point",
    actionCopy: "입덕 포인트 찾기",
    action: {
      label: "작품 대화",
      prompt: "이 작품 입덕 포인트를 같이 정리해보자",
      modeKey: "qa",
      qaActionKey: null,
    },
  },
];

interface Props {
  productId: number;
  productTitle: string;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  publishedLatestEpisodeNo?: number | null;
  syncedLatestEpisodeNo?: number | null;
  contextStatus?: string | null;
  isLoggedIn?: boolean;
  className?: string;
}

export default function WebsochatEntryCtas({
  productId,
  productTitle,
  authorNickname,
  coverImagePath,
  publishedLatestEpisodeNo,
  syncedLatestEpisodeNo,
  contextStatus,
  isLoggedIn = false,
  className = "",
}: Props) {
  const router = useRouter();
  const resolvedPublishedLatestEpisodeNo = Math.max(Number(publishedLatestEpisodeNo || 0), 0);
  const resolvedSyncedLatestEpisodeNo = Math.max(Number(syncedLatestEpisodeNo || 0), 0);
  const isContextReady = contextStatus === "ready";

  const selectedCta = useMemo(() => {
    const availablePool = WEBSOCHAT_ENTRY_CTA_POOL.filter((cta) => (
      isLoggedIn || cta.action.qaActionKey !== "next_episode_write"
    ));
    if (!availablePool.length) return null;
    const index = Math.floor(Math.random() * availablePool.length);
    return availablePool[index] || availablePool[0];
  }, [isLoggedIn]);

  const handleClickCta = (cta: WebsochatEntryCtaSpec) => {
    savePendingWebsochatLaunch({
      productId,
      title: productTitle,
      authorNickname,
      coverImagePath,
      latestEpisodeNo: publishedLatestEpisodeNo || 0,
      publishedLatestEpisodeNo: publishedLatestEpisodeNo || 0,
      syncedLatestEpisodeNo: syncedLatestEpisodeNo ?? null,
      contextStatus: contextStatus ?? null,
      action: cta.action,
    });
    router.push("/websochat");
  };

  if (!selectedCta) return null;
  if (!isContextReady) return null;
  if (resolvedPublishedLatestEpisodeNo <= 0) return null;
  if (resolvedSyncedLatestEpisodeNo <= 0) return null;

  return (
    <button
      type="button"
      onClick={() => handleClickCta(selectedCta)}
      className={`flex w-full items-center justify-center rounded-[10px] border border-transparent bg-light-gray-200 px-18pxr py-12pxr text-center transition-colors hover:bg-light-gray-300 ${className}`}
    >
      <span className="text-14pxr font-semibold tracking-[-2%] text-dark-gray-500 md:text-15pxr">
        이 작품으로{" "}
        <span className="text-primary-100">{selectedCta.actionCopy}</span>
      </span>
    </button>
  );
}
