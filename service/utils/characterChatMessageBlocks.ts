export type CharacterChatMessageBlock =
  | { kind: "narration"; text: string }
  | {
      kind: "dialogue";
      text: string;
      speakerName: string;
      isPrimarySpeaker: boolean;
    };

interface ParseCharacterChatMessageBlocksParams {
  content: string;
  primarySpeakerName: string;
  allowIncompleteFinalDialogue?: boolean;
}

const EXPLICIT_SPEAKER_PATTERN = /^([^:：\n]{1,40})\s*[:：]\s*(["“])([\s\S]*)$/;
const INLINE_EXPLICIT_SPEAKER_PATTERN =
  /(^|\s)([가-힣A-Za-z0-9_·'-]{1,20}(?:[ \t]+[가-힣A-Za-z0-9_·'-]{1,20}){0,2})[ \t]*[:：][ \t]*(["“])/g;

const normalizeSpeakerName = (value: string) => value.trim().replace(/\s+/g, " ");

const resolveSpeaker = (speakerName: string, primarySpeakerName: string) => {
  const normalizedSpeaker = normalizeSpeakerName(speakerName);
  const isPrimarySpeaker =
    normalizedSpeaker === primarySpeakerName ||
    normalizedSpeaker.startsWith(`${primarySpeakerName} `) ||
    primarySpeakerName.startsWith(`${normalizedSpeaker} `);
  return {
    speakerName: isPrimarySpeaker ? primarySpeakerName : normalizedSpeaker,
    isPrimarySpeaker,
  };
};

const readQuotedDialogue = (
  value: string,
  allowIncomplete: boolean
): string | null => {
  const openingQuote = value.charAt(0);
  if (openingQuote !== '"' && openingQuote !== "“") return null;

  const closingQuote = openingQuote === '"' ? '"' : "”";
  const hasClosingQuote = value.endsWith(closingQuote);
  if (!hasClosingQuote && !allowIncomplete) return null;

  const text = value.slice(1, hasClosingQuote ? -1 : undefined).trim();
  return text || null;
};

const parseDialogueSegment = ({
  value,
  primarySpeakerName,
  allowIncomplete,
}: {
  value: string;
  primarySpeakerName: string;
  allowIncomplete: boolean;
}): Extract<CharacterChatMessageBlock, { kind: "dialogue" }> | null => {
  const explicitSpeakerMatch = value.match(EXPLICIT_SPEAKER_PATTERN);
  if (explicitSpeakerMatch) {
    const speaker = resolveSpeaker(explicitSpeakerMatch[1], primarySpeakerName);
    const dialogueText = readQuotedDialogue(
      `${explicitSpeakerMatch[2]}${explicitSpeakerMatch[3]}`,
      allowIncomplete
    );
    if (speaker.speakerName && dialogueText) {
      return {
        kind: "dialogue",
        text: dialogueText,
        ...speaker,
      };
    }
  }

  const legacyDialogueText = readQuotedDialogue(value, allowIncomplete);
  if (!legacyDialogueText || !primarySpeakerName) return null;
  return {
    kind: "dialogue",
    text: legacyDialogueText,
    speakerName: primarySpeakerName,
    isPrimarySpeaker: true,
  };
};

const splitInlineExplicitDialogues = ({
  value,
  primarySpeakerName,
  allowIncomplete,
}: {
  value: string;
  primarySpeakerName: string;
  allowIncomplete: boolean;
}): string[] => {
  if (
    parseDialogueSegment({ value, primarySpeakerName, allowIncomplete })
  ) {
    return [value];
  }

  const segments: string[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  INLINE_EXPLICIT_SPEAKER_PATTERN.lastIndex = 0;

  while ((match = INLINE_EXPLICIT_SPEAKER_PATTERN.exec(value))) {
    const speakerStart = match.index + match[1].length;
    const speakerName = normalizeSpeakerName(match[2]);
    const openingQuoteIndex = match.index + match[0].lastIndexOf(match[3]);
    const closingQuote = match[3] === '"' ? '"' : "”";
    const closingQuoteIndex = value.indexOf(closingQuote, openingQuoteIndex + 1);
    const dialogueEnd =
      closingQuoteIndex >= 0
        ? closingQuoteIndex + 1
        : allowIncomplete
          ? value.length
          : -1;
    const nextCharacter = dialogueEnd >= 0 ? value.charAt(dialogueEnd) : "";
    const priorText = value.slice(0, speakerStart);
    const speaker = resolveSpeaker(speakerName, primarySpeakerName);
    const isGroundedSpeaker =
      speaker.isPrimarySpeaker || priorText.includes(speakerName);
    const hasCleanBoundary =
      !nextCharacter || /[\s.,!?…)}\]]/.test(nextCharacter);

    if (dialogueEnd < 0 || !isGroundedSpeaker || !hasCleanBoundary) {
      INLINE_EXPLICIT_SPEAKER_PATTERN.lastIndex = openingQuoteIndex + 1;
      continue;
    }

    const narration = value.slice(cursor, speakerStart).trim();
    if (narration) segments.push(narration);
    segments.push(value.slice(speakerStart, dialogueEnd).trim());
    cursor = dialogueEnd;
    INLINE_EXPLICIT_SPEAKER_PATTERN.lastIndex = dialogueEnd;
  }

  const remainder = value.slice(cursor).trim();
  if (remainder) segments.push(remainder);
  return segments.length > 1 ? segments : [value];
};

export const parseCharacterChatMessageBlocks = ({
  content,
  primarySpeakerName,
  allowIncompleteFinalDialogue = false,
}: ParseCharacterChatMessageBlocksParams): {
  blocks: CharacterChatMessageBlock[];
  hasDialogue: boolean;
} => {
  const normalizedContent = String(content || "").replace(/\r\n?/g, "\n").trim();
  if (!normalizedContent) return { blocks: [], hasDialogue: false };

  const normalizedPrimarySpeaker = normalizeSpeakerName(primarySpeakerName);
  const paragraphs = normalizedContent
    .split(/\n[\t ]*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const baseSegments = paragraphs.flatMap((paragraph, paragraphIndex) => {
    const completeDialogue = parseDialogueSegment({
      value: paragraph,
      primarySpeakerName: normalizedPrimarySpeaker,
      allowIncomplete: false,
    });
    if (completeDialogue || !paragraph.includes("\n")) {
      return [{ text: paragraph, paragraphIndex }];
    }
    return paragraph
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({ text, paragraphIndex }));
  });
  const segments = baseSegments.flatMap((segment, index) =>
    splitInlineExplicitDialogues({
      value: segment.text,
      primarySpeakerName: normalizedPrimarySpeaker,
      allowIncomplete:
        allowIncompleteFinalDialogue && index === baseSegments.length - 1,
    }).map((text) => ({ text, paragraphIndex: segment.paragraphIndex }))
  );
  let hasDialogue = false;
  const blocks: CharacterChatMessageBlock[] = [];
  let lastNarrationParagraphIndex: number | null = null;

  segments.forEach((segment, index) => {
    const dialogue = parseDialogueSegment({
      value: segment.text,
      primarySpeakerName: normalizedPrimarySpeaker,
      allowIncomplete:
        allowIncompleteFinalDialogue && index === segments.length - 1,
    });
    if (dialogue) {
      hasDialogue = true;
      blocks.push(dialogue);
      lastNarrationParagraphIndex = null;
      return;
    }

    const previousBlock = blocks[blocks.length - 1];
    if (
      previousBlock?.kind === "narration"
      && lastNarrationParagraphIndex === segment.paragraphIndex
    ) {
      previousBlock.text = `${previousBlock.text}\n${segment.text}`;
      return;
    }
    blocks.push({ kind: "narration", text: segment.text });
    lastNarrationParagraphIndex = segment.paragraphIndex;
  });

  return { blocks, hasDialogue };
};
