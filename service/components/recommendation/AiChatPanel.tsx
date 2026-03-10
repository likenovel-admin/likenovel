"use client";

import { useGetChatHistory, usePostAiChat } from "@/app/api/query/recommendation";
import { ErrorCodes } from "@/enums/errorCodes";
import { IChatMessage } from "@/store/chatStore";
import useChatStore from "@/store/chatStore";
import useAuthStore from "@/store/authStore";
import { removeLocalStorage, setLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
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

const HIDDEN_PREFIXES = ["/login", "/signup", "/find-password", "/reset-password", "/viewer"];

const parsePositiveId = (value?: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const AiChatPanel = () => {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const adultYn: "Y" | "N" = user?.isOnAdult ? "Y" : "N";
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    addUserMessage,
    addAssistantMessage,
    addExcludeId,
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

  const recentMessages = useMemo(() => messages.slice(-8), [messages]);
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
        skipUserMessage?: boolean;
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

      setErrorMessage(null);
      if (!options?.skipUserMessage) {
        addUserMessage(prompt);
      }
      setIsLoading(true);

      const requestMessages = [
        ...recentMessages.map((message) => ({
          role: message.role,
          content: message.content,
          product_id: message.product?.productId,
        })),
        { role: "user" as const, content: prompt },
      ];

      chat(
        {
          messages: requestMessages,
          context: {
            trigger,
            browsed_product_ids: contextBrowsedIds,
            ...pageContext,
          },
          preset: preset ?? null,
          exclude_product_ids: excludeIds,
          adult_yn: adultYn,
        },
        {
          onSuccess: (res) => {
            setIsLoading(false);
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
            });

            if (data.product) {
              addExcludeId(data.product.productId);
            }
          },
          onError: (error: unknown) => {
            setIsLoading(false);
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
                redirectToLogin();
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
      setIsLoading,
      chat,
      excludeIds,
      recentMessages,
      pageContext,
    ]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    handleRecommend(undefined, query.trim());
    setQuery("");
  };

  const hasAuthToken = () => {
    if (typeof window === "undefined") return false;
    return !!(
      localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
      sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    );
  };

  const redirectToLogin = () => {
    const currentPath = window.location.pathname + window.location.search;
    setLocalStorage(STORAGE_KEYS.PREVIOUS_PAGE, currentPath);
    setLocalStorage(STORAGE_KEYS.AI_RECOMMEND_OPEN_AFTER_LOGIN, "Y");
    router.push("/login?modal=open", { scroll: false });
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    const isAuthNow = isAuthenticated || hasAuthToken();
    if (!isAuthNow) {
      redirectToLogin();
      return;
    }
    setIsOpen(true);
  };

  // 로그인 후 자동 열기
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated && !hasAuthToken()) return;

    if (localStorage.getItem(STORAGE_KEYS.AI_RECOMMEND_OPEN_AFTER_LOGIN) === "Y") {
      setIsOpen(true);
      removeLocalStorage(STORAGE_KEYS.AI_RECOMMEND_OPEN_AFTER_LOGIN);
    }
  }, [isAuthenticated, pathname, setIsOpen]);

  // 브라우징 트리거
  useEffect(() => {
    const isAuthNow = isAuthenticated || hasAuthToken();
    if (!isAuthNow || !isOpen || !showBadge) return;
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
    isAuthenticated,
    isOpen,
    showBadge,
  ]);

  const matchPercent = (value: number) => Math.round(value * 100);
  const isBusy = isLoading || isPending;

  if (HIDDEN_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) {
    return null;
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        className="fixed bottom-20pxr right-4 md:right-6 z-40 w-[50px] h-[50px] rounded-full bg-primary-100 text-white shadow-[0_8px_20px_rgba(23,107,242,0.35)] flex flex-col items-center justify-center gap-[2px]"
        onClick={handleToggle}
      >
        {showBadge && !isOpen && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-11pxr font-bold text-primary-100">
            1
          </span>
        )}
        <span className="text-[10px] md:text-xs font-semibold leading-tight text-center whitespace-pre-line">
          {isOpen ? "닫기" : "AI\n추천"}
        </span>
      </button>

      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드 패널 */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[400px] bg-white shadow-[-4px_0_20px_rgba(0,0,0,0.12)] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
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
                      ? "max-w-[85%] bg-primary-100 text-white text-14pxr rounded-2xl rounded-tr-sm px-14pxr py-10pxr"
                      : "max-w-[90%] bg-light-gray-100 text-dark-gray-700 text-14pxr rounded-2xl rounded-tl-sm px-14pxr py-10pxr"
                  }
                >
                  {message.content}
                </div>
              </div>

              {/* 인라인 작품 카드 — 클릭 시 작품 페이지 이동 */}
              {message.role === "assistant" && message.product && (
                <div
                  className="mt-8pxr bg-light-gray-100 rounded-xl p-12pxr cursor-pointer hover:bg-light-gray-200 transition-colors"
                  onClick={() => router.push(`/product/${message.product?.productId}`)}
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
                      {message.product.tasteTags && message.product.tasteTags.length > 0 && (
                        <div className="flex flex-wrap gap-4pxr mt-6pxr">
                          {message.product.tasteTags.map((tag) => (
                            <span
                              key={tag}
                              className="text-11pxr text-dark-gray-500 bg-light-gray-200 px-6pxr py-2pxr rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
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
              )}
            </div>
          ))}

          {isBusy && (
            <div className="flex items-center py-12pxr">
              <div className="w-5 h-5 border-2 border-light-gray-500 border-t-primary-100 rounded-full animate-spin" />
              <span className="ml-8pxr text-13pxr text-dark-gray-400">AI가 작품을 찾고 있어요...</span>
            </div>
          )}

          {!!errorMessage && !isBusy && (
            <div className="bg-light-gray-100 border border-light-gray-400 rounded-lg px-12pxr py-10pxr text-13pxr text-red-100">
              {errorMessage}
            </div>
          )}
        </div>

        {/* 하단 고정: 프리셋 + 입력 */}
        <div className="shrink-0 border-t border-light-gray-300 px-16pxr py-12pxr bg-white">
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
    </>
  );
};

export default AiChatPanel;
