export type TiptapPlainTextNode = {
  type: "paragraph";
  content?: Array<{ type: "text"; text: string } | { type: "hardBreak" }>;
};

export const plainTextToTiptapParagraphs = (
  rawText: string
): TiptapPlainTextNode[] => {
  return rawText.replace(/\r\n/g, "\n").split("\n").map((line) => {
    if (line.trim().length === 0) {
      return {
        type: "paragraph",
        content: [{ type: "hardBreak" }],
      };
    }

    return {
      type: "paragraph",
      content: [{ type: "text", text: line }],
    };
  });
};
