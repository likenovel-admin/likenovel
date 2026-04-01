"use client";

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
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function StoryAgentPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { setConfirm } = useConfirmStore();
  const adultYn: "Y" | "N" = user?.isOnAdult ? "Y" : "N";
  const [keyword, setKeyword] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
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

  const selectedProduct = useMemo(
    () => productsData?.data?.find((item) => item.productId === selectedProductId) ?? null,
    [productsData, selectedProductId]
  );

  useEffect(() => {
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
  }, [sessionsData, activeSessionId]);

  useEffect(() => {
    if (!activeSession?.productId) return;
    if (selectedProductId === activeSession.productId) return;
    setSelectedProductId(activeSession.productId);
  }, [activeSession, selectedProductId]);

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
  const canSendMessage = activeSessionMeta?.canSendMessage ?? true;
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

  const handleForegroundSync = async () => {
    if (!guestKey) return;
    await queryClient.invalidateQueries({ queryKey: ["storyAgentSessions"] });
    if (activeSessionId) {
      await queryClient.invalidateQueries({ queryKey: ["storyAgentMessages", activeSessionId, guestKey] });
    }
  };

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
  }, [activeSessionId, guestKey, queryClient]);

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
        }
        await queryClient.invalidateQueries({ queryKey: ["storyAgentSessions"] });
        await queryClient.invalidateQueries({ queryKey: ["storyAgentMessages"] });
      },
      buttonCount: 2,
    });
  };

  const handleCreateSession = async () => {
    if (!selectedProductId) return;
    const response = await createSession({
      product_id: selectedProductId,
      guest_key: guestKey || undefined,
      adult_yn: adultYn,
    });
    await queryClient.invalidateQueries({ queryKey: ["storyAgentSessions", selectedProductId, guestKey, adultYn] });
    setActiveSessionId(response.data.sessionId);
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || !selectedProductId || !canSendMessage) return;

    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const created = await createSession({
          product_id: selectedProductId,
          guest_key: guestKey || undefined,
          adult_yn: adultYn,
        });
        sessionId = created.data.sessionId;
        setActiveSessionId(sessionId);
        await queryClient.invalidateQueries({ queryKey: ["storyAgentSessions", selectedProductId, guestKey, adultYn] });
      }

      await postMessage({
        sessionId,
        content,
        client_message_id: window.crypto.randomUUID(),
        guest_key: guestKey || undefined,
      });
      setDraft("");
      await queryClient.invalidateQueries({ queryKey: ["storyAgentMessages", sessionId, guestKey] });
      await queryClient.invalidateQueries({ queryKey: ["storyAgentSessions", selectedProductId, guestKey, adultYn] });
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
            className="w-full h-[48px] rounded-[12px] border border-light-gray-400 px-16pxr outline-none"
          />
          <div className="min-h-[120px] rounded-[12px] border border-light-gray-300 p-12pxr">
            {isProductsFetching ? (
              <Spinner size={28} />
            ) : keyword.trim().length === 0 ? (
              <p className="text-14pxr text-dark-gray-300">무료 작품을 검색해서 선택하세요.</p>
            ) : productsData?.data?.length ? (
              <div className="flex flex-col gap-8pxr">
                {productsData.data.map((product) => (
                  <button
                    key={product.productId}
                    type="button"
                    onClick={() => {
                      if (product.contextStatus !== "ready") return;
                      setSelectedProductId(product.productId);
                    }}
                    disabled={product.contextStatus !== "ready"}
                    className={`w-full rounded-[12px] border px-14pxr py-12pxr text-left ${
                      selectedProductId === product.productId
                        ? "border-primary-100 bg-light-gray-100"
                        : "border-light-gray-300"
                    } ${product.contextStatus !== "ready" ? "opacity-60 cursor-not-allowed" : ""}`}
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

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-16pxr">
          <div className="rounded-[16px] border border-light-gray-400 bg-white p-16pxr flex flex-col gap-12pxr">
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
                disabled={!selectedProductId || !isSelectedProductReady || isCreatingSession || isDeletingSession}
                onClick={handleCreateSession}
              >
                새 대화
              </Button>
            </div>
            <div className="min-h-[280px] flex flex-col gap-8pxr">
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

          <div className="rounded-[16px] border border-light-gray-400 bg-white p-16pxr flex flex-col gap-12pxr min-h-[520px]">
            <div className="flex items-center justify-between gap-8pxr border-b border-light-gray-300 pb-12pxr">
              <div>
                <div className="text-16pxr font-semibold">
                  {sessionContextTitle}
                </div>
                <div className="text-12pxr text-dark-gray-300">
                  {sessionContextDescription}
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-[320px] rounded-[12px] bg-light-gray-100 p-12pxr overflow-y-auto flex flex-col gap-10pxr">
              {isMessagesFetching ? (
                <Spinner size={24} />
              ) : messagesData?.data?.messages?.length ? (
                messagesData.data.messages.map((message) => (
                  <div
                    key={message.messageId}
                    className={`max-w-[85%] rounded-[12px] px-12pxr py-10pxr text-14pxr whitespace-pre-wrap ${
                      message.role === "user"
                        ? "self-end bg-primary-100 text-white"
                        : "self-start bg-white border border-light-gray-300 text-dark-gray-500"
                    }`}
                  >
                    {message.content}
                  </div>
                ))
              ) : (
                <div className="text-14pxr text-dark-gray-300">
                  메시지가 없습니다. 작품을 고르고 첫 질문을 보내세요.
                </div>
              )}
            </div>

            {activeSessionId && !canSendMessage ? (
              <div className="rounded-[12px] border border-light-gray-300 bg-light-gray-100 px-14pxr py-16pxr text-14pxr text-dark-gray-400">
                {unavailableMessage}
              </div>
            ) : (
              <div className="flex gap-8pxr">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="이 작품 기준으로 자유롭게 물어보세요. 예: 주인공 성격 분석해줘"
                  className="flex-1 min-h-[96px] rounded-[12px] border border-light-gray-400 px-12pxr py-10pxr outline-none resize-none"
                />
                <Button
                  size="md"
                  className="min-w-[88px] self-end"
                  disabled={!selectedProductId || !draft.trim() || isPostingMessage || isCreatingSession || isDeletingSession}
                  onClick={handleSend}
                >
                  전송
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
