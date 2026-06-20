"use client";

import { useGetChatHistory, usePostAiChat } from "@/app/api/query/recommendation";
import type { IAiSuggestedAction, IRecommendProduct } from "@/app/api/query/recommendation/dto";
import { ErrorCodes } from "@/enums/errorCodes";
import { IChatMessage } from "@/store/chatStore";
import useChatStore from "@/store/chatStore";
import useAuthStore from "@/store/authStore";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { removeLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
import {
  consumeQueuedAiLibrarianProductQuestion,
  openAiLibrarianPanel,
  redirectToAiLibrarianLogin,
} from "@/utils/aiLibrarianPanel";
import ProductStateBadge from "@/components/common/ProductStateBadge";
import SquareBadge from "@/components/common/SquareBadge";
import { getPromotionBadgeType } from "@/utils/getPromotionBadgeType";
import { IProduct } from "@/types";
import axios from "axios";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PRESETS = [
  { key: "stacked-chapters", label: "회차 쌓인 작품" },
  { key: "good-schedule", label: "연재주기 좋은 작품" },
  { key: "completed", label: "완결작 추천" },
  { key: "trending", label: "요즘 뜨는 작품" },
] as const;
type PresetKey = (typeof PRESETS)[number]["key"];

const HIDDEN_PREFIXES = ["/login", "/signup", "/find-password", "/reset-password", "/viewer", "/websochat"];
const CARD_TAG_LIMIT = 5;
const AI_CHAT_CONTEXT_MESSAGE_LIMIT = 12;
const FOLLOW_UP_QUESTION_LIMIT = 4;
const FOLLOW_UP_QUESTION_MIN = 3;

type IProductCardTagSource = {
  matchTags?: string[];
  tasteTags?: string[];
  worldviewTags?: string[];
  protagonistTypeTags?: string[];
  protagonistJobTags?: string[];
  protagonistMaterialTags?: string[];
  axisRomanceTags?: string[];
  axisStyleTags?: string[];
  primaryGenre?: string | null;
  subGenre?: string | null;
};

const parsePositiveId = (value?: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const normalizeCardTag = (value: string | null | undefined) =>
  String(value || "").replace(/\s+/g, " ").trim();

const buildCardDisplayTags = (product: IProductCardTagSource) => {
  const tags: string[] = [];
  const seen = new Set<string>();
  const append = (value: string | null | undefined) => {
    const tag = normalizeCardTag(value);
    if (!tag || seen.has(tag)) return;
    seen.add(tag);
    tags.push(tag);
  };

  [
    ...(product.matchTags || []),
    ...(product.protagonistJobTags || []),
    ...(product.protagonistMaterialTags || []),
    ...(product.protagonistTypeTags || []),
    ...(product.worldviewTags || []),
    ...(product.tasteTags || []),
    ...(product.axisStyleTags || []),
    ...(product.axisRomanceTags || []),
  ].forEach(append);

  append(product.primaryGenre);
  append(product.subGenre);

  return tags.slice(0, CARD_TAG_LIMIT);
};

const AiChatProductTags = ({ product }: { product: IProductCardTagSource }) => {
  const tags = buildCardDisplayTags(product);
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4pxr mt-6pxr">
      {tags.map((tag) => (
        <span
          key={tag}
          className="text-11pxr leading-4 text-dark-gray-500 bg-light-gray-200 px-6pxr py-2pxr rounded-full"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
};

type IProductFollowUpQuestion = IAiSuggestedAction;

const getSuggestedActionPriority = (action: IAiSuggestedAction) => {
  const priority = Number(action.priority);
  return Number.isFinite(priority) ? priority : null;
};

const sortSuggestedActions = (actions: IAiSuggestedAction[]) =>
  [...actions].sort((a, b) => {
    const priorityA = getSuggestedActionPriority(a);
    const priorityB = getSuggestedActionPriority(b);
    if (priorityA !== null || priorityB !== null) {
      return (priorityA ?? Number.MAX_SAFE_INTEGER) - (priorityB ?? Number.MAX_SAFE_INTEGER);
    }
    return a.label.length - b.label.length;
  });

const normalizeSuggestedActionsForRender = (actions?: IAiSuggestedAction[]) => {
  if (!Array.isArray(actions) || actions.length < FOLLOW_UP_QUESTION_MIN || actions.length > FOLLOW_UP_QUESTION_LIMIT) {
    return [];
  }
  const normalized = actions
    .filter((action) => action?.label?.trim() && action?.userMessage?.trim() && action?.intent)
    .slice(0, FOLLOW_UP_QUESTION_LIMIT);

  return normalized.length >= FOLLOW_UP_QUESTION_MIN ? sortSuggestedActions(normalized) : [];
};

const buildProductFollowUpQuestions = (
  product: IRecommendProduct,
  suggestedActions?: IAiSuggestedAction[]
): IProductFollowUpQuestion[] => {
  const serverActions = normalizeSuggestedActionsForRender(suggestedActions);
  if (serverActions.length > 0) return serverActions;

  const tags = buildCardDisplayTags(product);
  const primaryTag = tags[0];
  const questions: IProductFollowUpQuestion[] = [
    {
      id: "explain_match",
      actionId: "explain_match",
      label: "왜 제 취향에 맞나요?",
      userMessage: "왜 제 취향에 맞나요?",
      intent: "explain_match",
      priority: 10,
    },
  ];

  questions.push(
    {
      id: "explain_entry",
      actionId: "explain_entry",
      label: "초반 진입 포인트는?",
      userMessage: "초반 진입 포인트는?",
      intent: "explain_entry",
      priority: 20,
    },
    {
      id: "explain_attribute",
      actionId: "explain_attribute",
      label: primaryTag ? `#${primaryTag} 포인트가 뭐예요?` : "추천 근거가 뭐예요?",
      userMessage: primaryTag ? `#${primaryTag} 포인트가 뭐예요?` : "추천 근거가 뭐예요?",
      intent: "explain_attribute",
      topic: primaryTag,
      priority: 30,
    },
    {
      id: "recommend_similar",
      actionId: "recommend_similar",
      label: "비슷한 작품도 더 볼래요",
      userMessage: "비슷한 작품도 더 볼래요",
      intent: "recommend_similar",
      priority: 40,
    }
  );

  return sortSuggestedActions(questions.slice(0, FOLLOW_UP_QUESTION_LIMIT));
};

const AiChatProductFollowUps = ({
  product,
  suggestedActions,
  disabled,
  onAsk,
}: {
  product: IRecommendProduct;
  suggestedActions?: IAiSuggestedAction[];
  disabled: boolean;
  onAsk: (question: IProductFollowUpQuestion) => void;
}) => {
  const questions = buildProductFollowUpQuestions(product, suggestedActions);
  if (questions.length === 0) return null;

  return (
    <div className="mt-10pxr flex flex-col items-start gap-8pxr">
      {questions.map((question) => (
        <button
          key={question.label}
          type="button"
          className="max-w-[92%] rounded-full bg-gradient-to-r from-light-gray-100 to-light-gray-200 px-14pxr py-10pxr text-left text-14pxr font-medium leading-[1.45] text-dark-gray-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)] transition-colors hover:from-light-gray-200 hover:to-light-gray-300 disabled:opacity-30"
          onClick={(event) => {
            event.stopPropagation();
            onAsk(question);
          }}
          disabled={disabled}
        >
          {question.label}
        </button>
      ))}
    </div>
  );
};

const AiChatStandaloneFollowUps = ({
  suggestedActions,
  disabled,
  onAsk,
}: {
  suggestedActions?: IAiSuggestedAction[];
  disabled: boolean;
  onAsk: (question: IProductFollowUpQuestion) => void;
}) => {
  const questions = normalizeSuggestedActionsForRender(suggestedActions);
  if (questions.length === 0) return null;

  return (
    <div className="mt-8pxr flex flex-col items-start gap-8pxr">
      {questions.map((question) => (
        <button
          key={question.label}
          type="button"
          className="max-w-[92%] rounded-full bg-gradient-to-r from-light-gray-100 to-light-gray-200 px-14pxr py-10pxr text-left text-14pxr font-medium leading-[1.45] text-dark-gray-700 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)] transition-colors hover:from-light-gray-200 hover:to-light-gray-300 disabled:opacity-30"
          onClick={(event) => {
            event.stopPropagation();
            onAsk(question);
          }}
          disabled={disabled}
        >
          {question.label}
        </button>
      ))}
    </div>
  );
};

const AiChatLoadingSkeleton = () => (
  <div className="w-full py-8pxr" role="status" aria-label="AI가 작품을 찾고 있어요">
    <div className="max-w-[94%] rounded-2xl rounded-tl-sm bg-light-gray-100 px-14pxr py-12pxr">
      <div className="flex items-center gap-8pxr mb-10pxr">
        <div className="w-5 h-5 border-2 border-light-gray-500 border-t-primary-100 rounded-full animate-spin" />
        <div className="h-12pxr w-[132px] rounded-full bg-light-gray-300 animate-pulse" />
      </div>
      <div className="space-y-6pxr animate-pulse">
        <div className="h-12pxr w-[92%] rounded-full bg-light-gray-300" />
        <div className="h-12pxr w-[72%] rounded-full bg-light-gray-300" />
      </div>
    </div>

    <div className="mt-8pxr max-w-[94%] rounded-xl bg-light-gray-100 p-12pxr">
      <div className="flex gap-12pxr animate-pulse">
        <div className="w-[70px] h-[98px] flex-shrink-0 rounded-lg bg-light-gray-300" />
        <div className="flex-1 min-w-0 pt-2pxr">
          <div className="h-14pxr w-[78%] rounded-full bg-light-gray-300" />
          <div className="mt-8pxr h-10pxr w-[48%] rounded-full bg-light-gray-300" />
          <div className="mt-10pxr flex flex-wrap gap-4pxr">
            <div className="h-18pxr w-[48px] rounded-full bg-light-gray-300" />
            <div className="h-18pxr w-[58px] rounded-full bg-light-gray-300" />
            <div className="h-18pxr w-[52px] rounded-full bg-light-gray-300" />
          </div>
        </div>
      </div>
      <div className="mt-10pxr flex flex-col items-start gap-8pxr animate-pulse">
        <div className="h-36pxr w-[54%] rounded-full bg-light-gray-200" />
        <div className="h-36pxr w-[66%] rounded-full bg-light-gray-200" />
        <div className="h-36pxr w-[82%] rounded-full bg-light-gray-200" />
      </div>
    </div>
  </div>
);

const AiChatPanel = () => {
  const { user, accessToken } = useAuthStore();
  const adultYn: "Y" | "N" = user?.isOnAdult ? "Y" : "N";
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingFollowUpActionRef = useRef<string | null>(null);

  const {
    isOpen,
    isLoading,
    setIsOpen,
    setIsLoading,
    messages,
    excludeIds,
    showBadge,
    consumeBadge,
    browsedProductIds,
    pendingProductQuestion,
    addUserMessage,
    addAssistantMessage,
    addExcludeId,
    requestProductQuestion,
    consumePendingProductQuestion,
    initFromHistory,
    clearChat,
  } = useChatStore();

  const { mutate: chat, isPending } = usePostAiChat();
  const canLoadHistory = isOpen && messages.length === 0 && !!accessToken && !!user?.userId;
  const { data: historyData } = useGetChatHistory(canLoadHistory);

  // 서버 히스토리 → 스토어 초기화
  useEffect(() => {
    if (historyData?.data && historyData.data.length > 0) {
      initFromHistory(historyData.data);
    }
  }, [historyData, initFromHistory]);

  const recentMessages = useMemo(
    () => messages.slice(-AI_CHAT_CONTEXT_MESSAGE_LIMIT),
    [messages]
  );
  const activeFocusProductId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const productId = messages[index].role === "assistant" ? messages[index].product?.productId : undefined;
      if (productId) return productId;
    }
    return undefined;
  }, [messages]);
  const shouldShowPresetChips = messages.length === 0;
  const pageContext = useMemo(() => {
    const normalizedPath = pathname || "/";
    const segments = normalizedPath.split("/").filter(Boolean);

    if (normalizedPath === "/") {
      return { page_type: "home" as const, pathname: normalizedPath };
    }
    if (segments[0] === "product") {
      return {
        page_type: "product" as const,
        pathname: normalizedPath,
        current_product_id: parsePositiveId(segments[1]),
      };
    }
    if (segments[0] === "mypage") {
      return { page_type: "mypage" as const, pathname: normalizedPath };
    }
    return { page_type: "other" as const, pathname: normalizedPath };
  }, [pathname]);

  // 새 메시지 추가 시 스크롤 하단으로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleRecommend = useCallback(
    (
      preset?: PresetKey,
      freeQuery?: string,
      options?: {
        trigger?: "manual" | "browsing";
        browsedProductIds?: number[];
        contextProductId?: number;
        focusProductCard?: boolean;
        ignoreExcludeIds?: boolean;
        skipUserMessage?: boolean;
        resetSession?: boolean;
        sourceActionId?: string;
        sourceActionIntent?: IAiSuggestedAction["intent"];
      }
    ) => {
      const trigger = options?.trigger ?? "manual";
      const contextBrowsedIds =
        options?.browsedProductIds && options.browsedProductIds.length > 0
          ? options.browsedProductIds
          : [];
      const prompt =
        freeQuery?.trim() ||
        (preset
          ? `${PRESETS.find((item) => item.key === preset)?.label ?? "추천"} 작품 추천해줘`
          : "재미있는 작품 추천해줘");
      const sourceActionId = options?.sourceActionId?.trim();
      if (sourceActionId && pendingFollowUpActionRef.current === sourceActionId) {
        return;
      }
      if (sourceActionId) {
        pendingFollowUpActionRef.current = sourceActionId;
      }

      setErrorMessage(null);
      if (options?.resetSession) {
        clearChat();
      }
      if (!options?.skipUserMessage) {
        addUserMessage(prompt);
      }
      setIsLoading(true);

      const baseMessages = options?.resetSession ? [] : recentMessages;
      const requestMessages = [
        ...baseMessages.map((message) => ({
          role: message.role,
          content: message.content,
          product_id: message.product?.productId,
        })),
        { role: "user" as const, content: prompt },
      ];
      const activeContextProductId = options?.resetSession ? undefined : activeFocusProductId;
      const requestCurrentProductId =
        options?.contextProductId ?? activeContextProductId ?? pageContext.current_product_id;

      chat(
        {
          messages: requestMessages,
          context: {
            trigger,
            browsed_product_ids: contextBrowsedIds,
            ...pageContext,
            current_product_id: requestCurrentProductId,
            active_focus_product_id: options?.contextProductId ?? activeContextProductId,
            focus_product_card: Boolean(options?.focusProductCard),
            source_action_id: sourceActionId,
            source_action_intent: options?.sourceActionIntent,
          },
          preset: preset ?? null,
          exclude_product_ids: options?.ignoreExcludeIds || options?.resetSession ? [] : excludeIds,
          adult_yn: adultYn,
        },
        {
          onSuccess: (res) => {
            setIsLoading(false);
            if (sourceActionId && pendingFollowUpActionRef.current === sourceActionId) {
              pendingFollowUpActionRef.current = null;
            }
            const data = res.data;
            const tasteMatch = data.tasteMatch ?? data.taste_match ?? {
              protagonist: 0,
              mood: 0,
              pacing: 0,
            };

            addAssistantMessage({
              content: data.reply || "추천 결과가 없습니다.",
              product: data.product,
              tasteMatch,
              suggestedActions: data.suggestedActions,
            });

            if (data.product) {
              addExcludeId(data.product.productId);
            }
          },
          onError: (error: unknown) => {
            setIsLoading(false);
            if (sourceActionId && pendingFollowUpActionRef.current === sourceActionId) {
              pendingFollowUpActionRef.current = null;
            }
            if (axios.isAxiosError(error) && error.response?.status === 401) {
              const errorCode = error.response?.data?.code;
              const authRequiredCodes = [
                ErrorCodes.E4010,
                ErrorCodes.E4011,
                ErrorCodes.E4012,
              ];
              if (!errorCode || authRequiredCodes.includes(errorCode)) {
                const authMessage = "로그인이 필요합니다.";
                addAssistantMessage({ content: authMessage });
                setErrorMessage(authMessage);
                redirectToAiLibrarianLogin(router);
                return;
              }
            }
            const fallback = "잠시 후 다시 시도해주세요.";
            addAssistantMessage({ content: fallback });
            setErrorMessage(fallback);
          },
        }
      );
    },
    [
      adultYn,
      addAssistantMessage,
      addExcludeId,
      addUserMessage,
      activeFocusProductId,
      setIsLoading,
      chat,
      excludeIds,
      recentMessages,
      pageContext,
      router,
      clearChat,
    ]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    handleRecommend(undefined, query.trim());
    setQuery("");
  };

  const isBusy = isLoading || isPending;

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    openAiLibrarianPanel({ setIsOpen });
  };

  useEffect(() => {
    if (!isOpen || isBusy || !pendingProductQuestion) return;

    consumePendingProductQuestion();
    handleRecommend(undefined, pendingProductQuestion.prompt, {
      trigger: "manual",
      contextProductId: pendingProductQuestion.productId,
      focusProductCard: true,
      resetSession: true,
    });
  }, [
    consumePendingProductQuestion,
    handleRecommend,
    isBusy,
    isOpen,
    pendingProductQuestion,
  ]);

  // 로그인 후 자동 열기
  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldOpenAfterLogin =
      localStorage.getItem(STORAGE_KEYS.AI_RECOMMEND_OPEN_AFTER_LOGIN) === "Y";
    const queuedProductQuestion = consumeQueuedAiLibrarianProductQuestion(pageContext.current_product_id);

    if (shouldOpenAfterLogin) {
      setIsOpen(true);
      removeLocalStorage(STORAGE_KEYS.AI_RECOMMEND_OPEN_AFTER_LOGIN);
    }

    if (queuedProductQuestion) {
      setIsOpen(true);
      requestProductQuestion(queuedProductQuestion);
    }
  }, [pageContext.current_product_id, pathname, requestProductQuestion, setIsOpen]);

  // 브라우징 트리거
  useEffect(() => {
    if (!isOpen || !showBadge) return;
    if (browsedProductIds.length < 3) return;

    consumeBadge();
    handleRecommend(
      undefined,
      "최근에 본 작품 기반으로 비슷한 작품 추천해줘",
      {
        trigger: "browsing",
        browsedProductIds,
        skipUserMessage: true,
      }
    );
  }, [
    browsedProductIds,
    consumeBadge,
    handleRecommend,
    isOpen,
    showBadge,
  ]);

  const matchPercent = (value: number) => Math.round(value * 100);
  const isProductDetailPage = /^\/product\/\d+$/.test(pathname ?? "");
  const floatingButtonBottomClassName = isProductDetailPage
    ? "bottom-[96px] md:bottom-[98px]"
    : "bottom-20pxr";

  if (HIDDEN_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) {
    return null;
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        className={`fixed ${floatingButtonBottomClassName} right-4 md:right-6 ${
          isOpen ? "z-[90] pointer-events-none opacity-0" : "z-[130]"
        } w-[50px] h-[50px] rounded-full bg-primary-100 text-white shadow-[0_8px_20px_rgba(23,107,242,0.35)] flex flex-col items-center justify-center gap-[2px]`}
        onClick={handleToggle}
        aria-label={isOpen ? "AI 사서 닫기" : "AI 사서 열기"}
      >
        {showBadge && !isOpen && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-11pxr font-bold text-primary-100">
            1
          </span>
        )}
        <span className="text-[10px] md:text-xs font-semibold leading-tight text-center whitespace-pre-line">
          {isOpen ? "닫기" : "AI\n사서"}
        </span>
      </button>

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[110] bg-black/30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드 패널 */}
      {isOpen && (
        <div className="fixed top-0 right-0 z-[120] h-full w-full sm:w-[400px] bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.12)] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-20pxr py-16pxr border-b border-light-gray-300 shrink-0">
          <div className="flex items-center gap-8pxr">
            <span className="text-18pxr font-bold">AI 작품 추천</span>
            <span className="text-11pxr font-medium text-primary-100 bg-light-gray-200 px-6pxr py-1pxr rounded-full">
              BETA
            </span>
          </div>
          <div className="flex items-center gap-4pxr">
            {messages.length > 0 && (
              <button
                className="p-4pxr text-13pxr text-dark-gray-400 hover:text-dark-gray-600 transition-colors"
                onClick={clearChat}
              >
                초기화
              </button>
            )}
            <button className="p-4pxr" onClick={() => setIsOpen(false)}>
              <svg className="w-6 h-6 text-dark-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-16pxr py-16pxr space-y-12pxr">
          {messages.length === 0 && !isBusy && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-15pxr text-dark-gray-600 mb-16pxr">어떤 작품을 찾고 계세요?</p>
            </div>
          )}

          {messages.map((message: IChatMessage) => (
            <div key={message.id}>
              {/* 메시지 버블 */}
              <div className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] bg-primary-100 text-white text-14pxr leading-[1.55] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm px-14pxr py-10pxr"
                      : "max-w-[94%] bg-light-gray-100 text-dark-gray-700 text-14pxr leading-[1.6] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm px-14pxr py-10pxr"
                  }
                >
                  {message.content}
                </div>
              </div>

              {/* 인라인 작품 카드 — 클릭 시 작품 페이지 이동 */}
              {message.role === "assistant" && message.product && (
                <div className="mt-8pxr">
                  <div
                    className="bg-light-gray-100 rounded-xl p-12pxr cursor-pointer hover:bg-light-gray-200 transition-colors"
                    onClick={() => {
                      setPendingProductDetailEntrySource(
                        message.product!.productId,
                        PRODUCT_DETAIL_ENTRY_SOURCE.AI_CHAT_RECOMMEND
                      );
                      router.push(buildProductDetailPath(message.product!.productId));
                    }}
                  >
                    <div className="flex gap-12pxr">
                      <div className="relative flex-shrink-0 w-[70px] h-[98px] bg-light-gray-200 rounded-lg overflow-hidden">
                        {message.product.coverUrl ? (
                          <Image
                            src={message.product.coverUrl}
                            alt={message.product.title}
                            width={70}
                            height={98}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-11pxr text-dark-gray-300">
                            표지
                          </div>
                        )}
                        {message.product.priceType === "paid" &&
                          (message.product.waitingForFreeYn === "Y" || message.product.sixNinePathYn === "Y") && (
                          <div className="absolute flex bottom-[5px] left-[5px] gap-[2px]">
                            <SquareBadge
                              type={getPromotionBadgeType(
                                message.product.waitingForFreeYn,
                                0,
                                undefined,
                                message.product.sixNinePathYn
                              )}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-6pxr">
                          <h4 className="text-15pxr font-bold line-clamp-1 shrink min-w-0">
                            {message.product.title}
                          </h4>
                          <ProductStateBadge
                            product={{
                              priceType: message.product.priceType ?? "free",
                              state: { ongoingState: message.product.ongoingState ?? "ongoing" },
                              contract: {
                                monopolyYn: message.product.monopolyYn ?? "N",
                                cpContractYn: message.product.cpContractYn ?? "N",
                              },
                              badge: { newReleaseYn: message.product.newReleaseYn ?? "N" },
                              latestEpisodeDate: message.product.lastEpisodeDate ?? undefined,
                            } as IProduct}
                            hasFreeOrPaidBadge
                          />
                        </div>
                        {message.product.authorNickname && (
                          <p className="text-12pxr text-dark-gray-400 mt-2pxr">
                            {message.product.authorNickname} · {message.product.episodeCount}화
                            {message.product.serialCycle && (
                              <span className="text-dark-gray-300"> · {message.product.serialCycle}</span>
                            )}
                          </p>
                        )}
                        <AiChatProductTags product={message.product} />
                        {message.tasteMatch && (
                          <div className="flex flex-wrap gap-6pxr mt-4pxr">
                            {message.tasteMatch.protagonist > 0 && (
                              <span className="text-11pxr text-primary-100 bg-light-gray-200 px-6pxr py-2pxr rounded-full">
                                주인공 {matchPercent(message.tasteMatch.protagonist)}%
                              </span>
                            )}
                            {message.tasteMatch.mood > 0 && (
                              <span className="text-11pxr text-primary-100 bg-light-gray-200 px-6pxr py-2pxr rounded-full">
                                분위기 {matchPercent(message.tasteMatch.mood)}%
                              </span>
                            )}
                            {message.tasteMatch.pacing > 0 && (
                              <span className="text-11pxr text-primary-100 bg-light-gray-200 px-6pxr py-2pxr rounded-full">
                                전개 {matchPercent(message.tasteMatch.pacing)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <AiChatProductFollowUps
                    product={message.product}
                    suggestedActions={message.suggestedActions}
                    disabled={isBusy}
                    onAsk={(question) => {
                      const focusProductCard = question.intent !== "recommend_similar";
                      const sourceActionId = question.actionId || question.id || `${question.intent}:${question.topic || ""}:${question.label}`;
                      handleRecommend(undefined, question.userMessage || question.label, {
                        trigger: "manual",
                        contextProductId: message.product!.productId,
                        focusProductCard,
                        sourceActionId,
                        sourceActionIntent: question.intent,
                      });
                    }}
                  />
                </div>
              )}
              {message.role === "assistant" && !message.product && (
                <AiChatStandaloneFollowUps
                  suggestedActions={message.suggestedActions}
                  disabled={isBusy}
                  onAsk={(question) => {
                    const sourceActionId = question.actionId || question.id || `${question.intent}:${question.topic || ""}:${question.label}`;
                    handleRecommend(undefined, question.userMessage || question.label, {
                      trigger: "manual",
                      sourceActionId,
                      sourceActionIntent: question.intent,
                    });
                  }}
                />
              )}
            </div>
          ))}

          {isBusy && (
            <AiChatLoadingSkeleton />
          )}

          {!!errorMessage && !isBusy && (
            <div className="bg-light-gray-100 border border-light-gray-400 rounded-lg px-12pxr py-10pxr text-13pxr text-red-100">
              {errorMessage}
            </div>
          )}
        </div>

        {/* 하단 고정: 프리셋 + 입력 */}
        <div className="shrink-0 border-t border-light-gray-300 px-16pxr py-12pxr bg-white">
          {shouldShowPresetChips && (
            <div className="flex flex-wrap gap-6pxr mb-10pxr">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  className="px-12pxr py-6pxr text-12pxr font-medium rounded-full border border-light-gray-400 text-dark-gray-500 hover:bg-light-gray-200 hover:border-primary-100 hover:text-primary-100 transition-colors disabled:opacity-30"
                  onClick={() => handleRecommend(preset.key)}
                  disabled={isBusy}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-8pxr items-center">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={200}
              placeholder="메시지를 입력하세요"
              className="flex-1 px-14pxr py-10pxr text-14pxr border border-light-gray-400 rounded-xl focus:outline-none focus:border-primary-100"
              disabled={isBusy}
            />
            <button
              type="submit"
              className="shrink-0 w-[40px] h-[40px] flex items-center justify-center text-white bg-primary-100 rounded-xl hover:bg-primary-200 disabled:opacity-30 transition-opacity"
              disabled={isBusy || !query.trim()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
        </div>
      )}
    </>
  );
};

export default AiChatPanel;
