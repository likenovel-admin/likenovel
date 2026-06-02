const FONT_NODE_PATTERN = /<font\b[^>]*>([\s\S]*?)<\/font>/gi;
const PARAGRAPH_NODE_PATTERN = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
const BLOCK_NODE_PATTERN =
  /<(div|li|h[1-6]|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;

const decodeHtmlEntities = (value: string): string => {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === "#") {
      const isHex = entity[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(
        isHex ? entity.slice(2) : entity.slice(1),
        isHex ? 16 : 10
      );
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    switch (entity) {
      case "amp":
        return "&";
      case "lt":
        return "<";
      case "gt":
        return ">";
      case "quot":
        return '"';
      case "apos":
      case "#39":
        return "'";
      case "nbsp":
        return " ";
      default:
        return match;
    }
  });
};

const normalizeLine = (htmlLine: string): string => {
  return decodeHtmlEntities(
    htmlLine
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
  ).replace(/\n+$/g, "");
};

const appendBlankLine = (lines: string[]) => {
  if (lines.length > 0 && lines[lines.length - 1].trim().length > 0) {
    lines.push("");
  }
};

const appendTextLines = (lines: string[], text: string) => {
  for (const line of text.split("\n")) {
    if (line.trim().length === 0) {
      appendBlankLine(lines);
      continue;
    }

    lines.push(line);
  }
};

const trimOuterBlankLines = (lines: string[]): string[] => {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim().length === 0) {
    start += 1;
  }

  while (end > start && lines[end - 1].trim().length === 0) {
    end -= 1;
  }

  return lines.slice(start, end);
};

const extractFontPlainText = (pastedHtml: string): string | null => {
  const lines = Array.from(pastedHtml.matchAll(FONT_NODE_PATTERN), (match) =>
    normalizeLine(match[1] || "")
  );

  if (lines.length === 0 || lines.every((line) => line.trim().length === 0)) {
    return null;
  }

  return lines.join("\n");
};

const extractHtmlOnlyBlockPlainText = (pastedHtml: string): string | null => {
  const paragraphMatches = Array.from(
    pastedHtml.matchAll(PARAGRAPH_NODE_PATTERN),
    (match) => match[1] || ""
  );
  const blockMatches =
    paragraphMatches.length > 0
      ? paragraphMatches
      : Array.from(
          pastedHtml.matchAll(BLOCK_NODE_PATTERN),
          (match) => match[2] || ""
        );

  if (blockMatches.length === 0) {
    return null;
  }

  const lines: string[] = [];

  for (const blockHtml of blockMatches) {
    const blockText = normalizeLine(blockHtml);

    if (blockText.trim().length === 0) {
      appendBlankLine(lines);
      continue;
    }

    appendBlankLine(lines);
    appendTextLines(lines, blockText);
  }

  const trimmedLines = trimOuterBlankLines(lines);

  if (
    trimmedLines.length === 0 ||
    trimmedLines.every((line) => line.trim().length === 0)
  ) {
    return null;
  }

  return trimmedLines.join("\n");
};

const countBlankLines = (plainText: string): number => {
  return plainText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length === 0).length;
};

const normalizeNonBlankLines = (plainText: string): string => {
  return plainText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
};

export const recoverPlainTextFromClipboardHtml = (
  pastedHtml: string,
  pastedText: string
): string | null => {
  if (!pastedHtml) {
    return null;
  }

  const recoveredText =
    extractFontPlainText(pastedHtml) || extractHtmlOnlyBlockPlainText(pastedHtml);

  if (!pastedText) {
    return recoveredText;
  }

  if (!recoveredText) {
    return null;
  }

  if (countBlankLines(recoveredText) <= countBlankLines(pastedText)) {
    return null;
  }

  if (
    normalizeNonBlankLines(recoveredText) !==
    normalizeNonBlankLines(pastedText)
  ) {
    return null;
  }

  return recoveredText;
};
