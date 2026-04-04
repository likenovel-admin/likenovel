"use client";

import { DEFAULT_PRODUCT_IMAGE } from "@/constants/common";
import { useGetEpisodeList } from "@/app/api/query/product";
import {
  IStoryAgentCtaCardItem,
  IGetStoryAgentMessagesResponse,
  IStoryAgentMessageItem,
  IStoryAgentProductItem,
  IStoryAgentReasonCardItem,
  IStoryAgentStarterItem,
  IStoryAgentStarterActionItem,
} from "@/app/api/query/story-agent/dto";
import {
  useCreateStoryAgentSession,
  useDeleteStoryAgentSession,
  useGetStoryAgentMessages,
  useGetStoryAgentProducts,
  useGetStoryAgentSessions,
  usePostStoryAgentMessage,
} from "@/app/api/query/story-agent";
import Button from "@/components/common/Button";
import Spinner from "@/components/common/Spinner";
import useAuthStore from "@/store/authStore";
import useConfirmStore from "@/store/confirmStore";
import { STORAGE_KEYS } from "@/utils/localStorage";
import { buildProductDetailPath } from "@/utils/productPath";
import { buildViewerPath } from "@/utils/viewerPath";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const STORY_AGENT_EPISODE_RANGE_PATTERN = /(\d{1,4})\s*(?:~|-|–|—)\s*(\d{1,4})\s*화/g;
const STORY_AGENT_EPISODE_SINGLE_PATTERN = /(\d{1,4})\s*화/g;

const extractStoryAgentEpisodeRefs = (content: string, latestEpisodeNo: number) => {
  if (!content.trim() || latestEpisodeNo <= 0) return [] as number[];

  const episodeNos = new Set<number>();

  STORY_AGENT_EPISODE_RANGE_PATTERN.lastIndex = 0;
  STORY_AGENT_EPISODE_SINGLE_PATTERN.lastIndex = 0;

  let rangeMatch = STORY_AGENT_EPISODE_RANGE_PATTERN.exec(content);
  while (rangeMatch) {
    const first = Number(rangeMatch[1] || 0);
    const second = Number(rangeMatch[2] || 0);
    if (first && second) {
      const start = Math.max(1, Math.min(first, second));
      const end = Math.min(Math.max(first, second), latestEpisodeNo);

      for (let episodeNo = start; episodeNo <= end; episodeNo += 1) {
        episodeNos.add(episodeNo);
      }
    }

    rangeMatch = STORY_AGENT_EPISODE_RANGE_PATTERN.exec(content);
  }

  let singleMatch = STORY_AGENT_EPISODE_SINGLE_PATTERN.exec(content);
  while (singleMatch) {
    const episodeNo = Number(singleMatch[1] || 0);
    if (episodeNo && episodeNo <= latestEpisodeNo) {
      episodeNos.add(episodeNo);
    }

    singleMatch = STORY_AGENT_EPISODE_SINGLE_PATTERN.exec(content);
  }

  return Array.from(episodeNos).sort((a, b) => a - b);
};

const getStoryAgentMessageEpisodeRefs = (
  message: IStoryAgentMessageItem,
  latestEpisodeNo: number
) => {
  if (message.role !== "assistant") return [] as number[];
  if (message.referencedEpisodeNos?.length) {
    return message.referencedEpisodeNos;
  }
  return extractStoryAgentEpisodeRefs(message.content, latestEpisodeNo);
};

const formatStoryAgentReadScope = (
  episodeNo?: number | null,
  episodeTitle?: string | null
) => {
  if (!episodeNo || episodeNo <= 0) return "";
  const normalizedTitle = String(episodeTitle || "").trim();
  return normalizedTitle
    ? `${episodeNo}화(${normalizedTitle})`
    : `${episodeNo}화`;
};

const formatStoryAgentCitationLabel = (
  episodeNo?: number | null,
  episodeTitle?: string | null
) => {
  if (!episodeNo || episodeNo <= 0) {
    return {
      episodeNoText: "",
      episodeTitleText: null,
    };
  }
  const normalizedTitle = String(episodeTitle || "").trim();
  return {
    episodeNoText: `${episodeNo}화`,
    episodeTitleText: normalizedTitle || null,
  };
};

const buildStoryAgentProductSnapshot = ({
  productId,
  title,
  authorNickname,
  coverImagePath,
  latestEpisodeNo,
  contextStatus,
}: {
  productId: number;
  title: string;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  latestEpisodeNo?: number | null;
  contextStatus?: string | null;
}): IStoryAgentProductItem => ({
  productId,
  title,
  authorNickname: authorNickname || null,
  coverImagePath: coverImagePath || null,
  latestEpisodeNo: latestEpisodeNo || 0,
  contextStatus: contextStatus || "ready",
});

const renderStoryAgentReasonCards = (
  reasonCards: IStoryAgentReasonCardItem[] | null | undefined
) => {
  if (!reasonCards?.length) return null;
  return (
    <div className="mt-8pxr grid grid-cols-1 md:grid-cols-2 gap-6pxr">
      {reasonCards.map((card) => (
        <div
          key={`${card.title}-${card.description}`}
          className="rounded-[10px] border border-light-gray-300 bg-white px-10pxr py-8pxr"
        >
          <div className="text-12pxr font-semibold text-dark-gray-500">{card.title}</div>
          <div className="mt-4pxr text-12pxr text-dark-gray-400 whitespace-pre-wrap">
            {card.description}
          </div>
        </div>
      ))}
    </div>
  );
};

const renderStoryAgentActionCards = ({
  actionCards,
  onClick,
  disabled,
  activePrompt,
}: {
  actionCards: IStoryAgentStarterActionItem[] | null | undefined;
  onClick: (action: IStoryAgentStarterActionItem) => void;
  disabled?: boolean;
  activePrompt?: string | null;
}) => {
  if (!actionCards?.length) return null;
  return (
    <div className="mt-8pxr flex flex-wrap gap-6pxr">
      {actionCards.map((action) => (
        (() => {
          const isActive = !!activePrompt && activePrompt.trim() === action.prompt.trim();
          return (
        <button
          key={action.label}
          type="button"
          onClick={() => onClick(action)}
          disabled={disabled}
          className={`rounded-[10px] border px-10pxr py-8pxr text-12pxr font-medium ${
            isActive
              ? "border-primary-100 bg-primary-100 text-white"
              : "border-light-gray-400 bg-white text-dark-gray-500"
          } ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : isActive
                ? ""
                : "hover:border-primary-100 hover:text-primary-100"
          }`}
        >
          {isActive ? `${action.label}(클릭)` : action.label}
        </button>
          );
        })()
      ))}
    </div>
  );
};

const renderStoryAgentCtaCards = ({
  ctaCards,
  onClick,
}: {
  ctaCards: IStoryAgentCtaCardItem[] | null | undefined;
  onClick: (card: IStoryAgentCtaCardItem) => void;
}) => {
  if (!ctaCards?.length) return null;
  return (
    <div className="mt-8pxr flex flex-wrap gap-6pxr">
      {ctaCards.map((card) => (
        <button
          key={`${card.type}-${card.productId || 0}-${card.label}`}
          type="button"
          onClick={() => onClick(card)}
          className="rounded-[10px] border border-light-gray-400 bg-white px-10pxr py-8pxr text-12pxr font-medium text-dark-gray-500 hover:border-primary-100 hover:text-primary-100"
        >
          {card.label}
        </button>
      ))}
    </div>
  );
};

export default function StoryAgentPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, accessToken, isAuthInitialized } = useAuthStore();
  const { setConfirm } = useConfirmStore();
  const adultYn: "Y" | "N" = user?.isOnAdult ? "Y" : "N";
  const [keyword, setKeyword] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isPreparingNewSession, setIsPreparingNewSession] = useState(false);
  const [selectedProductSnapshot, setSelectedProductSnapshot] =
    useState<IStoryAgentProductItem | null>(null);
  const [stickyStarter, setStickyStarter] = useState<IStoryAgentStarterItem | null>(null);
  const [activeShortcutPrompt, setActiveShortcutPrompt] = useState("");
  const [guestKey, setGuestKey] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = localStorage.getItem(STORAGE_KEYS.STORY_AGENT_GUEST_KEY);
    if (existing) {
      setGuestKey(existing);
      return;
    }
    const nextKey = window.crypto.randomUUID();
    localStorage.setItem(STORAGE_KEYS.STORY_AGENT_GUEST_KEY, nextKey);
    setGuestKey(nextKey);
  }, []);

  const { data: productsData, isFetching: isProductsFetching } = useGetStoryAgentProducts(
    keyword,
    adultYn
  );
  const { data: selectedProductEpisodesData } = useGetEpisodeList(
    {
      product_id: String(selectedProductId || ""),
      page: 1,
      limit: 1,
      order_by: "episodeNo",
      order_dir: "asc",
    },
    isAuthInitialized && !!selectedProductId && (!!accessToken || isAuthenticated || !!user?.userId)
  );
  const { data: sessionsData, isFetching: isSessionsFetching } = useGetStoryAgentSessions(
    selectedProductId,
    guestKey,
    adultYn
  );
  const { data: messagesData, isFetching: isMessagesFetching } = useGetStoryAgentMessages(
    activeSessionId,
    guestKey
  );
  const { mutateAsync: createSession, isPending: isCreatingSession } = useCreateStoryAgentSession();
  const { mutateAsync: deleteSession, isPending: isDeletingSession } = useDeleteStoryAgentSession();
  const { mutateAsync: postMessage, isPending: isPostingMessage } = usePostStoryAgentMessage();

  const activeSession = useMemo(
    () => sessionsData?.data?.find((item) => item.sessionId === activeSessionId) ?? null,
    [sessionsData, activeSessionId]
  );
  const activeSessionMeta = messagesData?.data?.session ?? null;

  const selectedProduct = useMemo(() => {
    const matchedProduct = productsData?.data?.find((item) => item.productId === selectedProductId) ?? null;
    if (matchedProduct) return matchedProduct;
    if (selectedProductSnapshot?.productId === selectedProductId) return selectedProductSnapshot;
    return null;
  }, [productsData, selectedProductId, selectedProductSnapshot]);
  const detectedReadEpisodeNo = selectedProductEpisodesData?.data?.latestEpisodeNo ?? 0;
  const detectedReadEpisodeTitle = selectedProductEpisodesData?.data?.latestEpisodeTitle ?? "";
  const effectiveReadEpisodeNo = detectedReadEpisodeNo > 0 ? detectedReadEpisodeNo : null;
  const effectiveProductId =
    selectedProductId
    || activeSessionMeta?.productId
    || activeSession?.productId
    || selectedProductSnapshot?.productId
    || null;
  const latestVisibleEpisodeNo = selectedProduct?.latestEpisodeNo
    || activeSessionMeta?.latestEpisodeNo
    || 0;
  const activeSessionMessageCount = messagesData?.data?.messages?.length ?? 0;
  const citedEpisodeNos = useMemo(() => {
    const messages = messagesData?.data?.messages || [];
    const episodeNos = new Set<number>();

    messages.forEach((message) => {
      getStoryAgentMessageEpisodeRefs(message, latestVisibleEpisodeNo).forEach((episodeNo) => {
        episodeNos.add(episodeNo);
      });
    });

    return Array.from(episodeNos).sort((a, b) => a - b);
  }, [messagesData, latestVisibleEpisodeNo]);
  const citationEpisodeFetchLimit = citedEpisodeNos[citedEpisodeNos.length - 1] || 0;
  const { data: citationEpisodesData } = useGetEpisodeList(
    {
      product_id: String(selectedProductId || activeSessionMeta?.productId || ""),
      page: 1,
      limit: citationEpisodeFetchLimit,
      order_by: "episodeNo",
      order_dir: "asc",
    },
    !!(selectedProductId || activeSessionMeta?.productId) && citationEpisodeFetchLimit > 0
  );
  const citationEpisodeMap = useMemo(() => {
    const episodes = citationEpisodesData?.data?.episodes || [];
    return new Map(episodes.map((episode) => [episode.episodeNo, episode]));
  }, [citationEpisodesData]);
  const effectiveStarter = messagesData?.data?.starter || stickyStarter;

  useEffect(() => {
    if (isPreparingNewSession) return;
    if (!sessionsData?.data?.length) {
      setActiveSessionId(null);
      return;
    }
    if (!activeSessionId) {
      setActiveSessionId(sessionsData.data[0].sessionId);
      return;
    }
    const stillExists = sessionsData.data.some((item) => item.sessionId === activeSessionId);
    if (!stillExists) {
      setActiveSessionId(sessionsData.data[0].sessionId);
    }
  }, [sessionsData, activeSessionId, isPreparingNewSession]);

  useEffect(() => {
    if (!activeSession?.productId) return;
    if (selectedProductId === activeSession.productId) return;
    setSelectedProductId(activeSession.productId);
  }, [activeSession, selectedProductId]);

  useEffect(() => {
    if (messagesData?.data?.starter) {
      setStickyStarter(messagesData.data.starter);
    }
  }, [messagesData]);

  useEffect(() => {
    if (!activeSessionId) {
      setStickyStarter(null);
      setActiveShortcutPrompt("");
    }
  }, [activeSessionId]);

  useEffect(() => {
    if (!selectedProduct) return;
    setSelectedProductSnapshot(selectedProduct);
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) return;
    const snapshotProductId = activeSessionMeta?.productId;
    const snapshotTitle = activeSessionMeta?.productTitle;
    if (!snapshotProductId || !snapshotTitle) return;
    setSelectedProductSnapshot((current) => {
      if (current?.productId === snapshotProductId) return current;
      return buildStoryAgentProductSnapshot({
        productId: snapshotProductId,
        title: snapshotTitle,
        authorNickname: activeSessionMeta.productAuthorNickname,
        coverImagePath: activeSessionMeta.coverImagePath,
        latestEpisodeNo: activeSessionMeta.latestEpisodeNo,
        contextStatus: activeSessionMeta.contextStatus,
      });
    });
  }, [selectedProduct, activeSessionMeta]);

  const sessionContextTitle = selectedProduct?.title
    ?? activeSessionMeta?.productTitle
    ?? (activeSession ? "이전 세션 이어쓰기" : "작품을 먼저 선택하세요");
  const sessionContextDescription = selectedProduct
    ? `${selectedProduct.authorNickname || "작가명 없음"} · 공개 ${selectedProduct.latestEpisodeNo}화`
    : activeSessionMeta?.productTitle
      ? `${activeSessionMeta.productAuthorNickname || "작가명 없음"} · 공개 ${activeSessionMeta.latestEpisodeNo || 0}화`
      : activeSession
        ? "이전 세션을 다시 열었습니다."
        : "선택한 작품 기준으로 세션이 열립니다.";
  const sessionProductSummary = useMemo(() => {
    const productId = effectiveProductId;
    const title =
      selectedProduct?.title
      || selectedProductSnapshot?.title
      || activeSessionMeta?.productTitle
      || null;
    if (!productId || !title) return null;

    return {
      productId,
      title,
      authorNickname:
        selectedProduct?.authorNickname
        || selectedProductSnapshot?.authorNickname
        || activeSessionMeta?.productAuthorNickname
        || "작가명 없음",
      coverImagePath:
        selectedProduct?.coverImagePath
        || selectedProductSnapshot?.coverImagePath
        || activeSessionMeta?.coverImagePath
        || DEFAULT_PRODUCT_IMAGE,
      latestEpisodeNo:
        selectedProduct?.latestEpisodeNo
        || selectedProductSnapshot?.latestEpisodeNo
        || activeSessionMeta?.latestEpisodeNo
        || 0,
    };
  }, [activeSessionMeta, effectiveProductId, selectedProduct, selectedProductSnapshot]);
  const hasStartedConversation = !!activeSessionId && activeSessionMessageCount > 0;
  const canSwitchProductBeforeConversation =
    !!activeSessionId && !isMessagesFetching && activeSessionMessageCount === 0;
  const isProductSelectionLocked =
    !!activeSessionId && !isPreparingNewSession && !canSwitchProductBeforeConversation;
  const canUseAccountReadScope = !!accessToken || isAuthenticated || !!user?.userId;
  const detectedReadScope = formatStoryAgentReadScope(
    effectiveReadEpisodeNo,
    detectedReadEpisodeTitle
  );
  const detectedReadScopeLabel = !isAuthInitialized
    ? "읽은 범위 자동 감지: 확인 중"
    : effectiveReadEpisodeNo
      ? `읽은 범위 자동 감지: ${detectedReadScope}`
      : canUseAccountReadScope
        ? "읽은 범위 자동 감지: 아직 읽은 기록 없음"
        : "읽은 범위 자동 감지: 로그인 시 자동으로 맞춰집니다.";
  const sessionProductSummaryReadLabel = !isAuthInitialized && canUseAccountReadScope
    ? "확인 중"
    : effectiveReadEpisodeNo
      ? detectedReadScope
      : canUseAccountReadScope
        ? "아직 읽기 전"
        : "로그인 후 자동 감지";
  const isReadScopeGuardPending = !isAuthInitialized && canUseAccountReadScope;
  const canSendMessage = activeSessionMeta?.canSendMessage ?? true;
  const areShortcutActionsDisabled =
    !effectiveProductId
    || !canSendMessage
    || isPostingMessage
    || isCreatingSession
    || isDeletingSession
    || isReadScopeGuardPending;
  const isSelectedProductReady = selectedProduct
    ? selectedProduct.contextStatus === "ready"
    : (selectedProductId ? (activeSessionMeta?.canSendMessage ?? false) : false);
  const unavailableMessage =
    activeSessionMeta?.unavailableMessage || "비공개된 작품과는 더이상 이야기하실 수 없습니다.";

  const openLoginConfirm = () => {
    const currentUrl = encodeURIComponent(pathname || "/story-agent");
    setConfirm({
      content: "스토리 에이전트는 하루 2회까지 무료입니다. 계속하려면 로그인이 필요합니다.",
      confirmText: "로그인하기",
      onConfirm: () => {
        window.location.href = `/login?redirect=${currentUrl}`;
      },
      buttonCount: 2,
    });
  };

  const openCashChargeConfirm = () => {
    setConfirm({
      content: "무료 사용을 모두 소진했습니다. 캐시 20개가 필요합니다.",
      confirmText: "캐시 충전하기",
      onConfirm: () => {
        router.push("/product/mypage/cash");
      },
      buttonCount: 2,
    });
  };

  const handleForegroundSync = useCallback(async () => {
    if (!guestKey) return;
    await queryClient.invalidateQueries({ queryKey: ["storyAgentSessions"] });
    if (activeSessionId) {
      await queryClient.invalidateQueries({ queryKey: ["storyAgentMessages", activeSessionId, guestKey] });
    }
  }, [activeSessionId, guestKey, queryClient]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocus = () => {
      void handleForegroundSync();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void handleForegroundSync();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleForegroundSync]);

  const handleDeleteSession = (sessionId: number) => {
    setConfirm({
      content: "이 세션을 삭제합니다.",
      confirmText: "삭제",
      onConfirm: async () => {
        await deleteSession({
          sessionId,
          guest_key: guestKey || undefined,
        });
        if (activeSessionId === sessionId) {
          setDraft("");
          setIsPreparingNewSession(false);
          if (sessionsData?.data?.length === 1) {
            setSelectedProductSnapshot(null);
            setSelectedProductId(null);
          }
        }
        await queryClient.invalidateQueries({ queryKey: ["storyAgentSessions"] });
        await queryClient.invalidateQueries({ queryKey: ["storyAgentMessages"] });
      },
      buttonCount: 2,
    });
  };

  const handleCreateSession = async () => {
    if (isReadScopeGuardPending) return;
    if (activeSessionId && !isPreparingNewSession) {
      if (selectedProduct) {
        setSelectedProductSnapshot(selectedProduct);
      } else if (activeSessionMeta?.productId && activeSessionMeta?.productTitle) {
        const snapshotProductId = activeSessionMeta.productId;
        const snapshotTitle = activeSessionMeta.productTitle;
        setSelectedProductSnapshot(
          buildStoryAgentProductSnapshot({
            productId: snapshotProductId,
            title: snapshotTitle,
            authorNickname: activeSessionMeta.productAuthorNickname,
            coverImagePath: activeSessionMeta.coverImagePath,
            latestEpisodeNo: activeSessionMeta.latestEpisodeNo,
            contextStatus: activeSessionMeta.contextStatus,
          })
        );
      }
      setIsPreparingNewSession(true);
      setActiveSessionId(null);
      setDraft("");
      return;
    }
    if (!selectedProductId) return;
    const response = await createSession({
      product_id: selectedProductId,
      guest_key: guestKey || undefined,
      adult_yn: adultYn,
      game_read_episode_to: effectiveReadEpisodeNo,
    });
    await queryClient.invalidateQueries({ queryKey: ["storyAgentSessions", selectedProductId, guestKey, adultYn] });
    setIsPreparingNewSession(false);
    setActiveSessionId(response.data.sessionId);
    setSelectedProductSnapshot(response.data.product);
  };

  const handleSend = async (nextContent?: string) => {
    const content = (nextContent ?? draft).trim();
    if (!content || !effectiveProductId || !canSendMessage || isReadScopeGuardPending) return;

    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const created = await createSession({
          product_id: effectiveProductId,
          guest_key: guestKey || undefined,
          adult_yn: adultYn,
          game_read_episode_to: effectiveReadEpisodeNo,
        });
        sessionId = created.data.sessionId;
        setIsPreparingNewSession(false);
        setActiveSessionId(sessionId);
        setSelectedProductSnapshot(created.data.product);
        await queryClient.invalidateQueries({ queryKey: ["storyAgentSessions", effectiveProductId, guestKey, adultYn] });
      }

      const response = await postMessage({
        sessionId,
        content,
        client_message_id: window.crypto.randomUUID(),
        guest_key: guestKey || undefined,
        game_read_episode_to: effectiveReadEpisodeNo,
      });
      const previousMessagesPayload = queryClient.getQueryData<IGetStoryAgentMessagesResponse>([
        "storyAgentMessages",
        sessionId,
        guestKey,
      ]);
      queryClient.setQueryData(["storyAgentMessages", sessionId, guestKey], {
        data: {
          session: {
            sessionId,
            productId: effectiveProductId,
            title: activeSession?.title || content.slice(0, 40) || "새 대화",
            createdDate: activeSession?.createdDate || "",
            updatedDate: activeSession?.updatedDate || "",
            productTitle: selectedProduct?.title || activeSessionMeta?.productTitle || null,
            productAuthorNickname:
              selectedProduct?.authorNickname || activeSessionMeta?.productAuthorNickname || null,
            coverImagePath:
              selectedProduct?.coverImagePath || activeSessionMeta?.coverImagePath || null,
            latestEpisodeNo:
              selectedProduct?.latestEpisodeNo || activeSessionMeta?.latestEpisodeNo || 0,
            contextStatus: selectedProduct?.contextStatus || activeSessionMeta?.contextStatus || null,
            canSendMessage: activeSessionMeta?.canSendMessage ?? true,
            unavailableMessage: activeSessionMeta?.unavailableMessage || null,
          },
          messages: response.data.messages,
          starter: previousMessagesPayload?.data?.starter || messagesData?.data?.starter || stickyStarter || null,
        },
      });
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["storyAgentMessages", sessionId, guestKey] });
      await queryClient.invalidateQueries({ queryKey: ["storyAgentSessions", effectiveProductId, guestKey, adultYn] });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 && !user?.userId) {
          openLoginConfirm();
          return;
        }

        const message = error.response?.data?.message;
        if (message === "캐시 잔액이 부족합니다.") {
          openCashChargeConfirm();
          return;
        }
      }
      throw error;
    }
  };

  const handleClickEpisodeCitation = (episodeNo: number) => {
    const episode = citationEpisodeMap.get(episodeNo);
    const productId = selectedProductId || activeSessionMeta?.productId;
    if (!episode || !productId) return;
    window.open(
      buildViewerPath(episode.episodeId, { productId }),
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleSelectProduct = (product: IStoryAgentProductItem) => {
    if (product.contextStatus !== "ready") return;
    if (isProductSelectionLocked) return;

    if (canSwitchProductBeforeConversation) {
      setActiveSessionId(null);
      setStickyStarter(null);
      setActiveShortcutPrompt("");
      setDraft("");
    }

    setIsPreparingNewSession(false);
    setSelectedProductSnapshot(product);
    setSelectedProductId(product.productId);
  };

  const handleClickSessionProductSummary = () => {
    if (!sessionProductSummary?.productId) return;
    window.open(
      buildProductDetailPath(sessionProductSummary.productId),
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleClickStarterAction = (action: IStoryAgentStarterActionItem) => {
    if (!action.prompt.trim()) return;
    setActiveShortcutPrompt(action.prompt.trim());
    void handleSend(action.prompt);
  };

  const handleClickStoryAgentCtaCard = (card: IStoryAgentCtaCardItem) => {
    if (card.type === "product_detail" && card.productId) {
      router.push(buildProductDetailPath(card.productId));
    }
  };

  const handleClickSend = () => {
    setActiveShortcutPrompt("");
    void handleSend();
  };

  const sessionProductSummaryCard = sessionProductSummary ? (
    <button
      type="button"
      onClick={handleClickSessionProductSummary}
      className="rounded-[12px] border border-light-gray-300 bg-light-gray-100 px-12pxr py-12pxr text-left transition-colors hover:border-primary-100"
      aria-label={`${sessionProductSummary.title} 상세페이지를 새 탭에서 열기`}
    >
      <div className="flex items-start gap-12pxr">
        <div className="relative h-[76px] w-[56px] shrink-0 overflow-hidden rounded-[10px] border border-light-gray-300 bg-white">
          <Image
            src={sessionProductSummary.coverImagePath}
            alt={`${sessionProductSummary.title} 표지`}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-15pxr font-semibold text-dark-gray-500 line-clamp-1">
            {sessionProductSummary.title}
          </div>
          <div className="mt-4pxr text-12pxr text-dark-gray-400 line-clamp-1">
            {sessionProductSummary.authorNickname}
          </div>
          <div className="mt-8pxr grid grid-cols-2 gap-6pxr text-12pxr text-dark-gray-400">
            <div className="rounded-[8px] bg-white px-8pxr py-7pxr">
              <div className="text-11pxr text-dark-gray-300">총 회차수</div>
              <div className="mt-2pxr font-semibold text-dark-gray-500">
                {sessionProductSummary.latestEpisodeNo > 0
                  ? `${sessionProductSummary.latestEpisodeNo}화`
                  : "미확인"}
              </div>
            </div>
            <div className="rounded-[8px] bg-white px-8pxr py-7pxr">
              <div className="text-11pxr text-dark-gray-300">읽은 회차수</div>
              <div className="mt-2pxr font-semibold text-dark-gray-500 line-clamp-1">
                {sessionProductSummaryReadLabel}
              </div>
            </div>
          </div>
          <div className="mt-8pxr text-11pxr leading-[1.45] text-dark-gray-300">
            {hasStartedConversation
              ? "현재 세션에서는 한 번 선택한 작품은 변경되지 않습니다. 다른 작품을 가지고 이야기하고 싶으면 새 세션을 시작하세요."
              : "첫 메시지를 보내기 전까지는 작품을 바꿀 수 있습니다. 메시지를 보내면 현재 세션의 작품이 고정됩니다."}
          </div>
        </div>
      </div>
    </button>
  ) : null;

  return (
    <div className="w-full max-w-[1120px] mx-auto pt-[150px] md:pt-[145px] pb-[80px] px-16pxr md:px-0">
      <div className="flex flex-col gap-24pxr">
        <div className="flex flex-col gap-8pxr">
          <h1 className="text-28pxr font-bold">스토리 에이전트</h1>
          <p className="text-14pxr text-dark-gray-300">
            작품 하나를 고르면 그 작품을 아는 채팅 세션으로 대화합니다. 이번 단계는 검색/세션/메시지 저장 바닥만 먼저 연결했습니다.
          </p>
        </div>

        <div className="rounded-[16px] border border-light-gray-400 bg-white p-20pxr flex flex-col gap-16pxr">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="작품명 또는 작가명 검색"
            disabled={isProductSelectionLocked}
            className="w-full h-[48px] rounded-[12px] border border-light-gray-400 px-16pxr outline-none"
          />
          <div className="min-h-[120px] rounded-[12px] border border-light-gray-300 p-12pxr">
            {isProductsFetching ? (
              <Spinner size={28} />
            ) : keyword.trim().length === 0 ? (
              <p className="text-14pxr text-dark-gray-300">
                {isProductSelectionLocked
                  ? "현재 세션에서는 작품을 바꿀 수 없습니다. 새 대화로 전환한 뒤 다른 작품을 고르세요."
                  : "무료 작품을 검색해서 선택하세요."}
              </p>
            ) : productsData?.data?.length ? (
              <div className="flex flex-col gap-8pxr">
                {productsData.data.map((product) => (
                  <button
                    key={product.productId}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    disabled={product.contextStatus !== "ready" || isProductSelectionLocked}
                    className={`w-full rounded-[12px] border px-14pxr py-12pxr text-left ${
                      selectedProductId === product.productId
                        ? "border-primary-100 bg-light-gray-100"
                        : "border-light-gray-300"
                    } ${product.contextStatus !== "ready" || isProductSelectionLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-8pxr">
                      <div className="text-16pxr font-semibold">{product.title}</div>
                      <span
                        className={`text-12pxr font-medium ${
                          product.contextStatus === "ready" ? "text-primary-100" : "text-dark-gray-300"
                        }`}
                      >
                        {product.contextStatus === "ready" ? "대화 가능" : "준비 중"}
                      </span>
                    </div>
                    <div className="mt-4pxr text-13pxr text-dark-gray-300">
                      {product.authorNickname || "작가명 없음"} · 공개 {product.latestEpisodeNo}화
                    </div>
                    {product.contextStatus !== "ready" ? (
                      <div className="mt-4pxr text-12pxr text-dark-gray-300">
                        곧 대화할 수 있습니다.
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-14pxr text-dark-gray-300">검색 결과가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-16pxr h-[calc(100vh-220px)] md:h-[calc(100vh-160px)]">
          <div className="rounded-[16px] border border-light-gray-400 bg-white p-16pxr flex flex-col gap-12pxr h-full min-h-0 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-16pxr font-semibold">세션</div>
                <div className="text-12pxr text-dark-gray-300">
                  {sessionContextTitle}
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                disabled={!selectedProductId || !isSelectedProductReady || isCreatingSession || isDeletingSession || isReadScopeGuardPending}
                onClick={handleCreateSession}
              >
                {isPreparingNewSession ? "이 작품으로 시작" : "새 대화"}
              </Button>
            </div>
            <div className="flex-1 min-h-0 flex flex-col gap-8pxr overflow-y-auto pr-4pxr">
              {isSessionsFetching ? (
                <Spinner size={24} />
              ) : sessionsData?.data?.length ? (
                sessionsData.data.map((session) => (
                  <div
                    key={session.sessionId}
                    className={`rounded-[12px] border px-12pxr py-10pxr ${
                      activeSessionId === session.sessionId
                        ? "border-primary-100 bg-light-gray-100"
                        : "border-light-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-8pxr">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPreparingNewSession(false);
                          setSelectedProductSnapshot(null);
                          setSelectedProductId(session.productId);
                          setActiveSessionId(session.sessionId);
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="text-14pxr font-medium line-clamp-1">{session.title}</div>
                        <div className="mt-4pxr text-12pxr text-dark-gray-300">{session.updatedDate}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(session.sessionId)}
                        disabled={isDeletingSession}
                        className="shrink-0 text-12pxr text-dark-gray-300 hover:text-dark-gray-500 disabled:opacity-40"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-13pxr text-dark-gray-300">세션이 없습니다.</div>
              )}
            </div>
          </div>

          <div className="rounded-[16px] border border-light-gray-400 bg-white p-16pxr flex flex-col gap-12pxr h-full min-h-0 overflow-hidden">
            <div className="flex items-center justify-between gap-8pxr border-b border-light-gray-300 pb-12pxr">
              <div>
                <div className="text-16pxr font-semibold">
                  {sessionContextTitle}
                </div>
                <div className="text-12pxr text-dark-gray-300">
                  {sessionContextDescription}
                </div>
                <div className="mt-4pxr text-12pxr text-dark-gray-300">
                  {detectedReadScopeLabel}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 rounded-[12px] bg-light-gray-100 p-12pxr overflow-y-auto flex flex-col gap-10pxr">
              {effectiveStarter ? (
                <div className="self-start w-full rounded-[12px] border border-light-gray-300 bg-white px-12pxr py-10pxr">
                  <div className="flex flex-col gap-6pxr">
                    <div className="font-semibold text-dark-gray-500">
                      {effectiveStarter.productTitle}
                    </div>
                    <div className="text-13pxr text-dark-gray-400">
                      읽은 범위: {effectiveStarter.scopeState === "none"
                        ? "아직 읽기 전"
                        : effectiveStarter.readEpisodeNo
                          ? formatStoryAgentReadScope(
                            effectiveStarter.readEpisodeNo,
                            effectiveStarter.readEpisodeTitle
                          )
                          : "아직 확인되지 않음"}
                    </div>
                  </div>
                  {renderStoryAgentReasonCards(effectiveStarter.reasonCards)}
                  {renderStoryAgentActionCards({
                    actionCards: effectiveStarter.actions,
                    onClick: handleClickStarterAction,
                    disabled: areShortcutActionsDisabled,
                    activePrompt: activeShortcutPrompt,
                  })}
                  {renderStoryAgentCtaCards({
                    ctaCards: effectiveStarter.ctaCards,
                    onClick: handleClickStoryAgentCtaCard,
                  })}
                </div>
              ) : null}
              {isMessagesFetching ? (
                <Spinner size={24} />
              ) : messagesData?.data?.messages?.length ? (
                messagesData.data.messages.map((message) => {
                  const referencedEpisodeNos = getStoryAgentMessageEpisodeRefs(
                    message,
                    latestVisibleEpisodeNo
                  );

                  return (
                    <div
                      key={message.messageId}
                      className={`max-w-[85%] ${message.role === "user" ? "self-end" : "self-start"}`}
                    >
                      <div
                        className={`rounded-[12px] px-12pxr py-10pxr text-14pxr whitespace-pre-wrap ${
                          message.role === "user"
                            ? "bg-primary-100 text-white"
                            : "bg-white border border-light-gray-300 text-dark-gray-500"
                        }`}
                      >
                        {message.content}
                      </div>
                      {message.role === "assistant"
                        ? renderStoryAgentReasonCards(message.reasonCards)
                        : null}
                      {message.role === "assistant"
                        ? renderStoryAgentActionCards({
                          actionCards: message.actionCards,
                          onClick: handleClickStarterAction,
                          disabled: areShortcutActionsDisabled,
                          activePrompt: activeShortcutPrompt,
                        })
                        : null}
                      {message.role === "assistant"
                        ? renderStoryAgentCtaCards({
                          ctaCards: message.ctaCards,
                          onClick: handleClickStoryAgentCtaCard,
                        })
                        : null}
                      {referencedEpisodeNos.length > 0 ? (
                        <div className="mt-8pxr flex flex-wrap gap-6pxr">
                          {referencedEpisodeNos.map((episodeNo) => {
                            const episode = citationEpisodeMap.get(episodeNo);
                            const isClickable = !!episode;
                            const citationLabel = formatStoryAgentCitationLabel(
                              episodeNo,
                              episode?.episodeTitle
                            );

                            return (
                              <button
                                key={`${message.messageId}-${episodeNo}`}
                                type="button"
                                onClick={() => handleClickEpisodeCitation(episodeNo)}
                                disabled={!isClickable}
                                aria-label={citationLabel.episodeTitleText
                                  ? `${citationLabel.episodeNoText} ${citationLabel.episodeTitleText}로 이동`
                                  : `${episodeNo}화로 이동`}
                                className={`min-w-[72px] rounded-[10px] border px-10pxr py-8pxr text-left ${
                                  isClickable
                                    ? "border-light-gray-400 bg-white text-dark-gray-500 hover:border-primary-100 hover:text-primary-100"
                                    : "border-light-gray-300 bg-light-gray-100 text-dark-gray-300 cursor-default"
                                }`}
                              >
                                <div className="flex flex-col gap-2pxr">
                                  <span className="text-12pxr font-semibold leading-none">
                                    {citationLabel.episodeNoText}
                                  </span>
                                  {citationLabel.episodeTitleText ? (
                                    <span className="text-11pxr leading-[1.25] break-words">
                                      {citationLabel.episodeTitleText}
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="text-14pxr text-dark-gray-300">
                  메시지가 없습니다. 작품을 고르고 첫 질문을 보내세요.
                </div>
              )}
            </div>

            {sessionProductSummaryCard}

            {activeSessionId && !canSendMessage ? (
              <div className="rounded-[12px] border border-light-gray-300 bg-light-gray-100 px-14pxr py-16pxr text-14pxr text-dark-gray-400">
                {unavailableMessage}
              </div>
            ) : (
              <>
                <div className="flex gap-8pxr">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="이 작품 기준으로 자유롭게 물어보세요. 예: 주인공 성격 분석해줘"
                    disabled={isReadScopeGuardPending}
                    className="flex-1 min-h-[96px] rounded-[12px] border border-light-gray-400 px-12pxr py-10pxr outline-none resize-none disabled:bg-light-gray-100 disabled:text-dark-gray-300"
                  />
                  <Button
                    size="md"
                    className="min-w-[88px] self-end"
                    disabled={!selectedProductId || !draft.trim() || isPostingMessage || isCreatingSession || isDeletingSession || isReadScopeGuardPending}
                    onClick={handleClickSend}
                  >
                    전송
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
