import assert from "node:assert/strict";
import { plainTextToTiptapParagraphs } from "./plainTextToTiptapParagraphs.ts";

{
  const nodes = plainTextToTiptapParagraphs("첫 문단\n둘째 문단");

  assert.deepEqual(nodes, [
    { type: "paragraph", content: [{ type: "text", text: "첫 문단" }] },
    { type: "paragraph", content: [{ type: "text", text: "둘째 문단" }] },
  ]);
}

{
  const nodes = plainTextToTiptapParagraphs("첫 문단\n\n둘째 문단");

  assert.deepEqual(nodes, [
    { type: "paragraph", content: [{ type: "text", text: "첫 문단" }] },
    { type: "paragraph", content: [{ type: "hardBreak" }] },
    { type: "paragraph", content: [{ type: "text", text: "둘째 문단" }] },
  ]);
}

{
  const nodes = plainTextToTiptapParagraphs("  들여쓰기 유지\n\t탭 유지  ");

  assert.deepEqual(nodes, [
    { type: "paragraph", content: [{ type: "text", text: "  들여쓰기 유지" }] },
    { type: "paragraph", content: [{ type: "text", text: "\t탭 유지  " }] },
  ]);
}
