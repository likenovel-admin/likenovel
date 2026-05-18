"use client";

import {
  WEBSOCHAT_GHOST_FADE_MS,
  WEBSOCHAT_GHOST_QUESTIONS,
  WEBSOCHAT_GHOST_ROTATE_MS,
  WEBSOCHAT_MESSAGE_MAX_LENGTH,
} from "@/constants/common";
import { savePendingWebsochatLaunch } from "@/utils/websochatLaunch";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type PreviewMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface Props {
  productId: number;
  productTitle: string;
  authorNickname?: string | null;
  coverImagePath?: string | null;
  publishedLatestEpisodeNo?: number | null;
  syncedLatestEpisodeNo?: number | null;
  contextStatus?: string | null;
  isLoggedIn?: boolean;
  defaultOpen?: boolean;
  collapsible?: boolean;
  className?: string;
}

const PREVIEW_LIMIT = 2;

const buildPreviewAnswer = (productTitle: string, content: string) => {
  const trimmed = content.trim();

  if (/요약|줄거리|내용/.test(trimmed)) {
    return `"${productTitle}"의 흐름을 읽은 범위 안에서 정리해볼 수 있어요. 더 자세한 회차별 맥락은 웹소챗에서 이어서 볼 수 있습니다.`;
  }

  if (/인물|캐릭터|주인공|관계/.test(trimmed)) {
    return `인물 관계와 갈등 지점을 같이 짚어볼 수 있어요. 웹소챗으로 이동하면 읽은 범위 기준으로 더 깊게 이어집니다.`;
  }

  if (/다음|전개|예상|떡밥/.test(trimmed)) {
    return `지금까지 공개된 단서 안에서 다음 전개를 추측해볼 수 있어요. 이어서 웹소챗에서 더 구체적으로 이야기해보세요.`;
  }

  return `"${productTitle}"에 대해 바로 대화할 수 있어요. 궁금한 장면, 인물, 설정을 웹소챗에서 더 깊게 이어가 보세요.`;
};

export default function WebsochatMiniPreview({
  productId,
  productTitle,
  authorNickname,
  coverImagePath,
  publishedLatestEpisodeNo,
  syncedLatestEpisodeNo,
  contextStatus,
  isLoggedIn = false,
  defaultOpen = true,
  collapsible = true,
  className = "",
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(collapsible ? defaultOpen : true);
  const [inputValue, setInputValue] = useState("");
  const [previewCount, setPreviewCount] = useState(0);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [ghostIndex, setGhostIndex] = useState(() =>
    Math.floor(Math.random() * WEBSOCHAT_GHOST_QUESTIONS.length)
  );
  const [ghostVisible, setGhostVisible] = useState(true);

  const hasInput = inputValue.trim().length > 0;
  const hasConversation = messages.length > 0;
  const currentGhost = WEBSOCHAT_GHOST_QUESTIONS[ghostIndex];

  // ghost 질문 페이드 회전 — 입력이 비어 있을 때만 순환
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

  const launchWebsochat = (prompt?: string) => {
    const resolvedPrompt = prompt?.trim() || "이 작품에 대해 뭐든 편하게 이야기해줘";

    savePendingWebsochatLaunch({
      productId,
      title: productTitle,
      authorNickname,
      coverImagePath,
      latestEpisodeNo: publishedLatestEpisodeNo || 0,
      publishedLatestEpisodeNo: publishedLatestEpisodeNo || 0,
      syncedLatestEpisodeNo: syncedLatestEpisodeNo ?? null,
      contextStatus: contextStatus ?? null,
      launchSource: "product_detail_mini_preview",
      action: {
        label: "작품 대화",
        prompt: resolvedPrompt,
        modeKey: "qa",
        qaActionKey: null,
      },
    });
    router.push("/websochat");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (previewCount >= PREVIEW_LIMIT) {
      setPendingPrompt(trimmed);
      setShowContinuePrompt(true);
      setInputValue("");
      return;
    }

    const nextCount = previewCount + 1;
    const messageId = Date.now();
    setPreviewCount(nextCount);
    setPendingPrompt(trimmed);
    setMessages((current) => [
      ...current,
      {
        id: `user-${messageId}-${nextCount}`,
        role: "user",
        content: trimmed,
      },
      {
        id: `assistant-${messageId}-${nextCount}`,
        role: "assistant",
        content: buildPreviewAnswer(productTitle, trimmed),
      },
    ]);
    setInputValue("");
  };

  return (
    <section
      className={`flex flex-col overflow-hidden rounded-[16px] border border-light-gray-300 bg-light-gray-100 ${
        collapsible ? "" : "h-full"
      } ${className}`}
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
          className={`flex min-h-0 flex-col p-14pxr md:p-16pxr ${
            collapsible ? "border-t border-light-gray-300" : "flex-1"
          }`}
        >
          {hasConversation ? (
            <div
              className={`flex flex-col gap-10pxr overflow-y-auto pr-2pxr ${
                collapsible ? "max-h-[230px]" : "min-h-0 flex-1"
              }`}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[88%] whitespace-pre-wrap rounded-[14px] px-14pxr py-10pxr text-13pxr leading-[1.55] tracking-[-2%] ${
                    message.role === "user"
                      ? "ml-auto bg-primary-100 text-white"
                      : "bg-white text-dark-gray-500"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`flex flex-col items-center justify-center gap-6pxr rounded-[12px] bg-white px-16pxr py-20pxr text-center ${
                collapsible ? "" : "min-h-0 flex-1"
              }`}
            >
              <p className="text-14pxr font-semibold tracking-[-2%] text-black-100">
                작품에 대해 미리 물어보세요
              </p>
              <p className="text-12pxr leading-[1.6] tracking-[-2%] text-dark-gray-400">
                읽은 범위 안에서 AI가 답하고,
                <br />
                이어서 웹소챗으로 더 깊게 이야기할 수 있어요.
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-10pxr flex shrink-0 items-center gap-8pxr rounded-[20px] bg-white py-4pxr pl-14pxr pr-6pxr ring-1 ring-inset ring-light-gray-300 transition-shadow focus-within:ring-primary-100"
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
                className="w-full bg-transparent px-2pxr py-8pxr text-14pxr leading-[1.5] tracking-[-2%] text-black-100 outline-none"
                aria-label="미니 웹소챗 질문 입력"
              />
              {!hasInput ? (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-y-0 left-0 flex items-center px-2pxr text-13pxr tracking-[-2%] text-dark-gray-300 transition-opacity duration-200 ${
                    ghostVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {currentGhost}
                </span>
              ) : null}
            </div>
            {hasInput ? (
              <button
                type="submit"
                aria-label="미니 웹소챗 메시지 전송"
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary-100 text-white transition-colors hover:bg-primary-100/90"
              >
                <svg
                  aria-hidden="true"
                  width="17"
                  height="17"
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
            ) : (
              <button
                type="button"
                onClick={acceptGhost}
                aria-label="추천 질문 채우기"
                title="Tab 키로도 채울 수 있어요"
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-light-gray-400 bg-white text-dark-gray-400 transition-colors hover:border-primary-100 hover:text-primary-100"
              >
                <svg
                  aria-hidden="true"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  focusable="false"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </form>

          {showContinuePrompt ? (
            <div className="mt-12pxr shrink-0 rounded-[12px] border border-light-gray-300 bg-white px-12pxr py-12pxr">
              <p className="text-13pxr font-semibold tracking-[-2%] text-black-100">
                웹소챗에서 이어서 이야기해볼까요?
              </p>
              <p className="mt-4pxr text-12pxr leading-[18px] tracking-[-2%] text-dark-gray-400">
                웹소챗에서는 작품을 읽은 범위 안에서 더 깊게 대화할 수 있어요.
              </p>
              <div className="mt-10pxr flex gap-8pxr">
                <button
                  type="button"
                  onClick={() => launchWebsochat(pendingPrompt)}
                  className="flex-1 rounded-[10px] bg-primary-100 px-12pxr py-10pxr text-13pxr font-semibold tracking-[-2%] text-white hover:bg-primary-100/90"
                >
                  웹소챗에서 계속하기
                </button>
                <button
                  type="button"
                  onClick={() => setShowContinuePrompt(false)}
                  className="rounded-[10px] border border-light-gray-500 px-12pxr py-10pxr text-13pxr font-semibold tracking-[-2%] text-dark-gray-500"
                >
                  닫기
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
