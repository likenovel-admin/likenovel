"use client";

import {
  postWebsochatMessageOnce,
  postWebsochatMessageStream,
  useCreateWebsochatSession,
  WebsochatStreamEvent,
} from "@/app/api/query/websochat";
import { IWebsochatMessageItem } from "@/app/api/query/websochat/dto";
import WebsochatGuideBubble from "@/components/websochat/WebsochatGuideBubble";
import useAuthStore from "@/store/authStore";
import useConfirmStore from "@/store/confirmStore";
import {
  WEBSOCHAT_GHOST_FADE_MS,
  WEBSOCHAT_GHOST_QUESTIONS,
  WEBSOCHAT_GHOST_ROTATE_MS,
  WEBSOCHAT_MESSAGE_MAX_LENGTH,
} from "@/constants/common";
import {
  buildWebsochatIdleGuideMessage,
  buildWebsochatMiniPreviewStateKey,
  getOrCreateWebsochatGuestKey,
  readWebsochatMiniPreviewState,
  saveActiveWebsochatSessionId,
  saveWebsochatReturnPath,
  saveWebsochatMiniPreviewState,
  saveWebsochatSessionPendingDraft,
} from "@/utils/websochatLaunch";
import {
  getWebsochatSafeUserMessage,
  isRetryableWebsochatStreamError,
} from "@/utils/websochatError";
import { useQueryClient } from "@tanstack/react-query";
import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type PreviewMessage = Pick<
  IWebsochatMessageItem,
  "messageId" | "role" | "content" | "createdDate"
> & {
  isStreaming?: boolean;
};

const MINI_PREVIEW_MESSAGE_LIMIT = 2;

interface Props {
  productId: number;
  productTitle: string;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  priceType?: string | null;
  adultYn?: "Y" | "N" | null;
  publishedLatestEpisodeNo?: number | null;
  syncedLatestEpisodeNo?: number | null;
  contextStatus?: string | null;
  isLoggedIn?: boolean;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}

const normalizeMiniPreviewContent = (content?: string | null) =>
  String(content ?? "").trim().slice(0, WEBSOCHAT_MESSAGE_MAX_LENGTH);

export default function WebsochatMiniPreview({
  productId,
  productTitle,
  authorNickname,
  coverImagePath,
  adultYn,
  publishedLatestEpisodeNo,
  syncedLatestEpisodeNo,
  contextStatus,
  defaultOpen = true,
  collapsible = true,
  className = "",
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setConfirm } = useConfirmStore();
  const { user, isAuthenticated, accessToken } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
  }));
  const { mutateAsync: createSession } = useCreateWebsochatSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(collapsible ? defaultOpen : true);
  const [inputValue, setInputValue] = useState("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [completedSendCount, setCompletedSendCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [streamingStatusMessage, setStreamingStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [ghostIndex, setGhostIndex] = useState(0);
  const [ghostVisible, setGhostVisible] = useState(true);
  const [miniPreviewStateKey, setMiniPreviewStateKey] = useState("");

  const hasInput = inputValue.trim().length > 0;
  const currentGhost = WEBSOCHAT_GHOST_QUESTIONS[ghostIndex];
  const idleGuideMessage = buildWebsochatIdleGuideMessage(productTitle);

  useEffect(() => {
    if (hasInput) return;
    const timer = window.setInterval(() => {
      setGhostVisible(false);
      window.setTimeout(() => {
        setGhostIndex(
          (current) => (current + 1) % WEBSOCHAT_GHOST_QUESTIONS.length
        );
        setGhostVisible(true);
      }, WEBSOCHAT_GHOST_FADE_MS);
    }, WEBSOCHAT_GHOST_ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [hasInput]);

  useEffect(() => {
    const hasWaitingAssistant = messages.some(
      (message) =>
        message.role === "assistant" &&
        message.isStreaming &&
        !String(message.content || "").trim()
    );
    if (!hasWaitingAssistant) {
      setStreamingStatusMessage("");
      return;
    }

    const timer1 = window.setTimeout(() => {
      setStreamingStatusMessage("읽은 데까지 먼저 맞춰보는 중이에요.");
    }, 1200);
    const timer2 = window.setTimeout(() => {
      setStreamingStatusMessage("관련 장면이랑 감정선 같이 보고 있어요.");
    }, 3500);
    const timer3 = window.setTimeout(() => {
      setStreamingStatusMessage("조금만 더, 답을 다듬고 있어요.");
    }, 7000);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
    };
  }, [messages]);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (!messageList) return;
    window.requestAnimationFrame(() => {
      messageList.scrollTop = messageList.scrollHeight;
    });
  }, [messages, streamingStatusMessage]);

  const acceptGhost = () => {
    setInputValue(currentGhost);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (hasInput) return;
    if (event.key === "Tab" || event.key === "ArrowRight") {
      event.preventDefault();
      acceptGhost();
    }
  };

  const canUseAccountScope = useCallback(() => {
    if (accessToken || isAuthenticated || user?.userId) return true;
    if (typeof window === "undefined") return false;
    return Boolean(
      window.localStorage.getItem("access_token") ||
        window.sessionStorage.getItem("access_token")
    );
  }, [accessToken, isAuthenticated, user?.userId]);

  const resolveGuestKey = () =>
    canUseAccountScope() ? null : getOrCreateWebsochatGuestKey();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const guestKey = canUseAccountScope() ? null : getOrCreateWebsochatGuestKey();
    const nextStateKey = buildWebsochatMiniPreviewStateKey({
      productId,
      userId: user?.userId || null,
      guestKey,
    });
    const savedState = readWebsochatMiniPreviewState(nextStateKey);

    setMiniPreviewStateKey(nextStateKey);
    setSessionId(null);
    setMessages([]);
    setErrorMessage("");
    setInputValue("");
    setCompletedSendCount(savedState?.completedSendCount || 0);
  }, [canUseAccountScope, productId, user?.userId]);

  const continueInWebsochat = async (draft?: string) => {
    const normalizedDraft = normalizeMiniPreviewContent(draft);

    try {
      const nextSessionId = sessionId || (await ensurePreviewSession());

      saveActiveWebsochatSessionId(nextSessionId);
      if (normalizedDraft) {
        saveWebsochatSessionPendingDraft(nextSessionId, normalizedDraft);
      }
      saveWebsochatReturnPath();
      router.push("/websochat");
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "웹소챗 세션을 만들지 못했습니다. 잠시 후 다시 시도해 주세요."
      );
    }
  };

  const openContinueConfirm = (draft: string) => {
    setConfirm({
      content: (
        <>
          <span>웹소챗에서 이어서 이야기할 수 있어요.</span>
          <span className="mt-6pxr text-13pxr font-normal leading-[1.5] text-dark-gray-400">
            확인을 누르면 지금 대화하던 작품 세션으로 이동합니다.
          </span>
          <span className="mt-4pxr text-13pxr font-normal leading-[1.5] text-dark-gray-400">
            매일 무료로 3번까지 메시지 전송이 가능합니다.
          </span>
        </>
      ),
      confirmText: "웹소챗에서 계속하기",
      onConfirm: () => continueInWebsochat(draft),
      buttonCount: 2,
    });
  };

  const ensurePreviewSession = async () => {
    if (sessionId) return sessionId;
    const guestKey = resolveGuestKey();
    const created = await createSession({
      product_id: productId,
      guest_key: guestKey || undefined,
      adult_yn: adultYn === "Y" ? "Y" : "N",
    });
    const nextSessionId = created.data.sessionId;
    setSessionId(nextSessionId);
    saveActiveWebsochatSessionId(nextSessionId);
    saveWebsochatMiniPreviewState(miniPreviewStateKey, {
      completedSendCount,
    });
    return nextSessionId;
  };

  const sendPreviewMessage = async (content: string) => {
    const nextSessionId = await ensurePreviewSession();
    const guestKey = resolveGuestKey();
    const clientMessageId =
      typeof window !== "undefined" && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const now = Date.now();
    const userMessageId = -now;
    const assistantMessageId = -(now + 1);

    setErrorMessage("");
    setMessages((current) => [
      ...current,
      {
        messageId: userMessageId,
        role: "user",
        content,
        clientMessageId,
        createdDate: new Date(now).toISOString(),
      } as PreviewMessage,
      {
        messageId: assistantMessageId,
        role: "assistant",
        content: "",
        createdDate: new Date(now + 1).toISOString(),
        isStreaming: true,
      },
    ]);

    let completedData: { sessionId: number; messages: IWebsochatMessageItem[] } | null = null;
    let streamError = "";
    const requestBody = {
      sessionId: nextSessionId,
      content,
      client_message_id: clientMessageId,
      guest_key: guestKey || undefined,
      starter_mode_key: null,
      qa_action_key: null,
      rp_mode: null,
      active_character: null,
      game_mode: null,
      game_read_episode_to: null,
      account_read_episode_to: null,
    };

    try {
      let shouldRetryStreamWithOnce = false;
      try {
        await postWebsochatMessageStream(
          requestBody,
          (event: WebsochatStreamEvent) => {
            if (event.event === "assistant_delta" && event.data.delta) {
              setMessages((current) =>
                current.map((message) =>
                  message.messageId === assistantMessageId
                    ? {
                        ...message,
                        content: `${message.content || ""}${event.data.delta || ""}`,
                        isStreaming: true,
                      }
                    : message
                )
              );
              return;
            }
            if (event.event === "assistant_completed") {
              completedData = event.data;
              return;
            }
            if (event.event === "assistant_error") {
              streamError =
                typeof event.data?.detail === "string" && event.data.detail.trim()
                  ? event.data.detail.trim()
                  : "웹소챗 응답을 불러오지 못했습니다.";
            }
          }
        );
      } catch (error) {
        if (!isRetryableWebsochatStreamError(error)) {
          throw error;
        }
        shouldRetryStreamWithOnce = true;
      }

      if (streamError) {
        throw new Error(streamError);
      }

      if (shouldRetryStreamWithOnce || !completedData) {
        const response = await postWebsochatMessageOnce(requestBody);
        completedData = response.data;
      }

      const resolvedCompletedData = completedData;
      setMessages((current) => {
        const nextMessages = current.filter(
          (message) =>
            message.messageId !== userMessageId &&
            message.messageId !== assistantMessageId
        );
        const existingIds = new Set(
          nextMessages.map((message) => message.messageId)
        );
        resolvedCompletedData.messages.forEach((message) => {
          if (existingIds.has(message.messageId)) return;
          nextMessages.push(message);
          existingIds.add(message.messageId);
        });
        return nextMessages;
      });
      setCompletedSendCount((current) => {
        const nextCount = current + 1;
        saveWebsochatMiniPreviewState(miniPreviewStateKey, {
          completedSendCount: nextCount,
        });
        return nextCount;
      });
      await queryClient.invalidateQueries({ queryKey: ["websochatSessions"] });
      await queryClient.invalidateQueries({ queryKey: ["websochatMessages"] });
    } catch (error) {
      setMessages((current) =>
        current.filter(
          (message) =>
            message.messageId !== userMessageId &&
            message.messageId !== assistantMessageId
        )
      );
      setErrorMessage(getWebsochatSafeUserMessage(error));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = normalizeMiniPreviewContent(inputValue);
    if (!trimmed) return;
    if (isSending) return;

    if (completedSendCount >= MINI_PREVIEW_MESSAGE_LIMIT) {
      openContinueConfirm(trimmed);
      return;
    }

    setInputValue("");
    setIsSending(true);
    try {
      await sendPreviewMessage(trimmed);
    } finally {
      setIsSending(false);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-[12px] border border-light-gray-300 bg-white ${className}`}
      aria-label="웹소챗 미리보기"
    >
      {collapsible ? (
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-12pxr px-16pxr py-14pxr text-left"
          aria-expanded={isOpen}
        >
          <span className="truncate text-15pxr font-semibold tracking-[-2%] text-black-100">
            웹소챗으로 작품 이야기하기
          </span>
          <span className="shrink-0 rounded-full border border-light-gray-400 bg-white px-10pxr py-5pxr text-12pxr font-medium tracking-[-2%] text-dark-gray-500">
            {isOpen ? "접기" : "열기"}
          </span>
        </button>
      ) : null}

      {isOpen ? (
        <div
            className={`flex flex-col p-14pxr md:p-16pxr ${
              collapsible
                ? "min-h-[320px] justify-end border-t border-light-gray-300"
                : "min-h-0 flex-1 justify-end"
            }`}
        >
          <div
            ref={messageListRef}
            className={`flex flex-col gap-10pxr overflow-y-auto px-2pxr py-12pxr ${
              collapsible ? "h-[230px] min-h-0" : "h-[320px] min-h-0"
            }`}
          >
            <WebsochatGuideBubble size="compact" className="max-w-[92%]">
              {idleGuideMessage}
            </WebsochatGuideBubble>
            {messages.map((message) => (
              <div
                key={message.messageId}
                className={`flex flex-col gap-6pxr ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[92%] whitespace-pre-wrap rounded-[12px] px-12pxr py-9pxr text-12pxr leading-[1.55] tracking-[-2%] ${
                    message.role === "user"
                      ? "bg-primary-100 text-white"
                      : "bg-light-gray-100 text-dark-gray-500"
                  }`}
                >
                  {message.content || (message.isStreaming ? "..." : "")}
                </div>
                {message.role === "assistant" &&
                message.isStreaming &&
                streamingStatusMessage ? (
                  <div className="max-w-[92%] px-4pxr text-11pxr leading-[1.4] tracking-[-2%] text-dark-gray-300">
                    {streamingStatusMessage}
                  </div>
                ) : null}
              </div>
              ))}
          </div>
          {errorMessage ? (
            <p className="mt-8pxr text-12pxr leading-[1.45] tracking-[-2%] text-red-500">
              {errorMessage}
            </p>
          ) : null}

          <form
            onSubmit={handleSubmit}
            className="mt-10pxr flex shrink-0 items-center gap-8pxr rounded-[12px] bg-light-gray-100 py-4pxr pl-12pxr pr-6pxr ring-1 ring-inset ring-light-gray-300 transition-colors focus-within:bg-white focus-within:ring-primary-100"
          >
            <div className="relative min-w-0 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=""
                maxLength={WEBSOCHAT_MESSAGE_MAX_LENGTH}
                className="w-full bg-transparent px-2pxr py-8pxr text-12pxr leading-[1.5] tracking-[-2%] text-black-100 outline-none"
                aria-label="웹소챗 질문 입력"
                aria-busy={isSending}
                readOnly={isSending}
              />
              {!hasInput ? (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-y-0 left-0 flex items-center px-2pxr text-12pxr tracking-[-2%] text-dark-gray-300 transition-opacity duration-200 ${
                    ghostVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {currentGhost}
                </span>
              ) : null}
            </div>
            <button
              type="submit"
              aria-label={
                completedSendCount >= MINI_PREVIEW_MESSAGE_LIMIT
                  ? "웹소챗에서 계속하기"
                  : "미니 웹소챗 메시지 전송"
              }
              disabled={!hasInput || isSending}
              className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-primary-100 text-white transition-colors hover:bg-primary-100/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                focusable="false"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
