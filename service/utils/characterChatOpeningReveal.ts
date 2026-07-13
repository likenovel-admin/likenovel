export const CHARACTER_CHAT_OPENING_LEAD_IN_MS = 360;

const CHARACTER_CHAT_OPENING_MIN_REVEAL_MS = 900;
const CHARACTER_CHAT_OPENING_MAX_REVEAL_MS = 2_800;
const CHARACTER_CHAT_OPENING_MS_PER_CHARACTER = 18;

interface ResolveCharacterChatOpeningRevealFrameParams {
  content: string;
  elapsedMs: number;
  prefersReducedMotion?: boolean;
}

interface ShouldShowCharacterChatOpeningPlaceholderParams {
  isOpeningBusy: boolean;
  hasOpeningMessage: boolean;
  hasError: boolean;
}

export const shouldShowCharacterChatOpeningPlaceholder = ({
  isOpeningBusy,
  hasOpeningMessage,
  hasError,
}: ShouldShowCharacterChatOpeningPlaceholderParams) =>
  isOpeningBusy && !hasOpeningMessage && !hasError;

export const shouldReleaseCharacterChatOpeningLoad = ({
  hasOpeningSession,
  isFetching,
  isError,
  hasLoadedResponse,
  hasOpeningMessage,
}: {
  hasOpeningSession: boolean;
  isFetching: boolean;
  isError: boolean;
  hasLoadedResponse: boolean;
  hasOpeningMessage: boolean;
}) =>
  hasOpeningSession
  && !isFetching
  && !hasOpeningMessage
  && (isError || hasLoadedResponse);

export const resolveCharacterChatOpeningRevealFrame = ({
  content,
  elapsedMs,
  prefersReducedMotion = false,
}: ResolveCharacterChatOpeningRevealFrameParams) => {
  const characters = Array.from(content);
  if (!characters.length || prefersReducedMotion) {
    return {
      visibleText: content,
      isWaiting: false,
      isComplete: true,
    };
  }

  const safeElapsedMs = Math.max(0, elapsedMs);
  if (safeElapsedMs < CHARACTER_CHAT_OPENING_LEAD_IN_MS) {
    return {
      visibleText: "",
      isWaiting: true,
      isComplete: false,
    };
  }

  const revealDurationMs = Math.max(
    CHARACTER_CHAT_OPENING_MIN_REVEAL_MS,
    Math.min(
      CHARACTER_CHAT_OPENING_MAX_REVEAL_MS,
      characters.length * CHARACTER_CHAT_OPENING_MS_PER_CHARACTER
    )
  );
  const revealElapsedMs = safeElapsedMs - CHARACTER_CHAT_OPENING_LEAD_IN_MS;
  const visibleCharacterCount = Math.min(
    characters.length,
    Math.max(1, Math.ceil((revealElapsedMs / revealDurationMs) * characters.length))
  );
  const isComplete = visibleCharacterCount >= characters.length;

  return {
    visibleText: isComplete
      ? content
      : characters.slice(0, visibleCharacterCount).join(""),
    isWaiting: false,
    isComplete,
  };
};
