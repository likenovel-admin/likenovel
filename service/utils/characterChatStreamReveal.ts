const CHARACTER_CHAT_STREAM_REVEAL_INTERVAL_MS = 33;
const CHARACTER_CHAT_STREAM_REVEAL_TARGET_CPS = 40;
const CHARACTER_CHAT_STREAM_REVEAL_MIN_MS = 450;
const CHARACTER_CHAT_STREAM_REVEAL_MAX_MS = 1_800;

type CharacterChatStreamRevealTimer = ReturnType<typeof setTimeout>;

interface CreateCharacterChatStreamRevealParams {
  onUpdate: (visibleText: string) => void;
  isActive?: () => boolean;
  intervalMs?: number;
  resolveChunkSize?: (pendingCharacterCount: number) => number;
}

type CharacterChatStreamingKind = "qa" | "rp" | "ideal_worldcup";

export const resolveCharacterChatStreamingKind = ({
  inferredKind,
  activeSessionKind,
}: {
  inferredKind: CharacterChatStreamingKind;
  activeSessionKind?: string | null;
}): CharacterChatStreamingKind =>
  activeSessionKind === "character_chat" && inferredKind === "qa"
    ? "rp"
    : inferredKind;

export interface CharacterChatStreamRevealController {
  append: (text: string) => void;
  drain: () => Promise<void>;
  cancel: () => void;
}

export const resolveCharacterChatStreamRevealChunkSize = (
  pendingCharacterCount: number
) => {
  const safeCharacterCount = Math.max(0, Math.floor(pendingCharacterCount));
  if (!safeCharacterCount) return 0;

  const targetDurationMs = Math.max(
    CHARACTER_CHAT_STREAM_REVEAL_MIN_MS,
    Math.min(
      CHARACTER_CHAT_STREAM_REVEAL_MAX_MS,
      Math.round(
        (safeCharacterCount / CHARACTER_CHAT_STREAM_REVEAL_TARGET_CPS) * 1000
      )
    )
  );
  const tickCount = Math.max(
    1,
    Math.ceil(targetDurationMs / CHARACTER_CHAT_STREAM_REVEAL_INTERVAL_MS)
  );
  return Math.max(1, Math.ceil(safeCharacterCount / tickCount));
};

export const createCharacterChatStreamReveal = ({
  onUpdate,
  isActive = () => true,
  intervalMs = CHARACTER_CHAT_STREAM_REVEAL_INTERVAL_MS,
  resolveChunkSize = resolveCharacterChatStreamRevealChunkSize,
}: CreateCharacterChatStreamRevealParams): CharacterChatStreamRevealController => {
  const pendingCharacters: string[] = [];
  const visibleCharacters: string[] = [];
  const drainResolvers = new Set<() => void>();
  let timer: CharacterChatStreamRevealTimer | null = null;
  let canceled = false;
  let charactersPerTick = 1;

  const settleDrains = () => {
    if (timer || pendingCharacters.length) return;
    drainResolvers.forEach((resolve) => resolve());
    drainResolvers.clear();
  };

  const cancel = () => {
    canceled = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pendingCharacters.length = 0;
    settleDrains();
  };

  const scheduleNextTick = () => {
    if (canceled || timer || !pendingCharacters.length) {
      settleDrains();
      return;
    }

    timer = setTimeout(() => {
      timer = null;
      if (!isActive()) {
        cancel();
        return;
      }

      visibleCharacters.push(
        ...pendingCharacters.splice(0, charactersPerTick)
      );
      onUpdate(visibleCharacters.join(""));
      if (!pendingCharacters.length) {
        charactersPerTick = 1;
      }
      scheduleNextTick();
    }, Math.max(0, intervalMs));
  };

  return {
    append: (text: string) => {
      if (canceled || !text) return;
      pendingCharacters.push(...Array.from(text));
      charactersPerTick = Math.max(
        charactersPerTick,
        resolveChunkSize(pendingCharacters.length)
      );
      scheduleNextTick();
    },
    drain: () => {
      if (canceled || (!timer && !pendingCharacters.length)) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        drainResolvers.add(resolve);
      });
    },
    cancel,
  };
};
