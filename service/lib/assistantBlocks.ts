/**
 * 웹소챗 RP 응답을 지문(narration)/대사(dialogue) 블록으로 파싱한다.
 * char_chat_project_v2 의 일반 캐릭터챗 파서(src/lib/assistantBlocks.js)를 TS로 이식.
 *
 * 규칙:
 * - 대사(dialogue): 큰따옴표 계열로 시작하는 세그먼트.
 * - 지문(narration): 명시적 마커(`* ` 또는 `[ ... ]`).
 * - 마커 없는 평문: 응답에 따옴표 대사가 함께 있으면 지문으로 재분류, 없으면 대사 유지.
 * - `"A" [N] "B"` 처럼 한 줄에 섞인 경우 3블록으로 분리.
 */

export type AssistantBlockKind = "narration" | "dialogue";

export interface AssistantBlock {
  kind: AssistantBlockKind;
  text: string;
}

interface ClassifiedBlock extends AssistantBlock {
  _quoted?: boolean;
}

const QUOTE_START_CHARS = ['"', "“", "”", "＂"];
const QUOTE_END_BY_START: Record<string, string> = {
  '"': '"',
  "“": "”",
  "”": "”",
  "＂": "＂",
};
const FULLWIDTH_OPEN_BRACKET = "［";
const FULLWIDTH_CLOSE_BRACKET = "］";

const SPEAKER_PREFIX_RE = /^(?:\s*)(?:user|character|npc|assistant)\s*[:\-]\s*/i;

function isQuoteStart(ch: string): boolean {
  return QUOTE_START_CHARS.includes(String(ch || ""));
}

function stripSpeakerPrefix(text: string): string {
  return String(text || "").replace(SPEAKER_PREFIX_RE, "").trim();
}

function stripNameLabelBeforeQuote(text: string): string {
  const src = String(text || "").trim();
  if (!src) return "";

  const idx = Array.from(src).findIndex((ch) => isQuoteStart(ch));
  if (idx <= 0) return src;

  const before = src.slice(0, idx);
  if (/^[^"'\n\r]{1,24}\s*[:\-]\s*$/.test(before)) {
    return src.slice(idx).trim();
  }
  return src;
}

function stripOuterDialogueQuotes(text: string): string {
  const src = String(text || "").trim();
  if (!src || !isQuoteStart(src[0])) return src;

  const qStart = src[0];
  const qEnd = QUOTE_END_BY_START[qStart] || qStart;
  let body = src.slice(1).trim();

  if (body.endsWith(qEnd)) {
    body = body.slice(0, -1).trim();
  }
  return body;
}

function splitMixedSegments(text: string): string[] {
  const src = String(text || "").trim();
  if (!src) return [];

  const out: string[] = [];
  let buf = "";
  let i = 0;

  const flushBuf = () => {
    const t = String(buf || "").trim();
    if (t) out.push(t);
    buf = "";
  };

  while (i < src.length) {
    const ch = src[i];

    if (isQuoteStart(ch)) {
      flushBuf();
      const qEnd = QUOTE_END_BY_START[ch] || ch;
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === qEnd) {
          j += 1;
          break;
        }
        j += 1;
      }
      out.push(src.slice(i, Math.min(j, src.length)).trim());
      i = Math.min(j, src.length);
      continue;
    }

    if (ch === "[" || ch === FULLWIDTH_OPEN_BRACKET) {
      flushBuf();
      const close = ch === FULLWIDTH_OPEN_BRACKET ? FULLWIDTH_CLOSE_BRACKET : "]";
      let j = i + 1;
      while (j < src.length && src[j] !== close) j += 1;
      if (j < src.length) j += 1;
      out.push(src.slice(i, Math.min(j, src.length)).trim());
      i = Math.min(j, src.length);
      continue;
    }

    buf += ch;
    i += 1;
  }

  flushBuf();
  return out.length ? out : [src];
}

function classifySegment(segment: string): ClassifiedBlock | null {
  const s = String(segment || "").trim();
  if (!s) return null;

  if (/^\*\s+/.test(s)) {
    return { kind: "narration", text: s.replace(/^\*\s+/, "").trim() };
  }

  if (
    (s.startsWith("[") && s.endsWith("]")) ||
    (s.startsWith(FULLWIDTH_OPEN_BRACKET) && s.endsWith(FULLWIDTH_CLOSE_BRACKET))
  ) {
    return { kind: "narration", text: s.slice(1, -1).trim() };
  }

  if (isQuoteStart(s[0])) {
    const body = stripOuterDialogueQuotes(s);
    return { kind: "dialogue", text: body || s, _quoted: true };
  }

  return { kind: "dialogue", text: s, _quoted: false };
}

export function parseAssistantBlocks(text: string): AssistantBlock[] {
  const source = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!source.trim()) return [];
  if (!Array.from(source).some((ch) => isQuoteStart(ch))) {
    return [{ kind: "dialogue", text: source.trim() }];
  }

  const out: ClassifiedBlock[] = [];
  const lines = source.split("\n");

  for (const raw of lines) {
    const line = stripNameLabelBeforeQuote(stripSpeakerPrefix(raw));
    if (!String(line || "").trim()) continue;

    const segments = splitMixedSegments(line);
    for (const seg of segments) {
      const block = classifySegment(seg);
      if (!block || !block.text) continue;

      // 분리된 블록 사이에 문장부호만 남는 지문 박스 생성 방지.
      if (block.kind === "narration" && /^[\s.,!?~]+$/.test(block.text) && out.length > 0) {
        const last = out[out.length - 1];
        out[out.length - 1] = { ...last, text: `${String(last?.text || "")}${block.text.trim()}` };
        continue;
      }
      out.push(block);
    }
  }

  if (!out.length && source.trim()) {
    return [{ kind: "narration", text: source.trim() }];
  }

  // 따옴표 대사가 있으면, 따옴표 없는 평문을 지문으로 재분류.
  const hasQuotedDialogue = out.some((b) => b._quoted === true);
  if (hasQuotedDialogue) {
    for (const b of out) {
      if (b._quoted === false && b.kind === "dialogue") {
        b.kind = "narration";
      }
    }
  }

  // 내부 메타 필드 정리.
  return out.map(({ kind, text }) => ({ kind, text }));
}
