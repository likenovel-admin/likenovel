export const normalizeViewerContentHtml = (html: string): string => {
  if (!html) return html;
  if (typeof DOMParser === "undefined") return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
  const body = doc.body;

  body.querySelectorAll("p").forEach((paragraph) => {
    const text = (paragraph.textContent || "")
      .replace(/\u00a0/g, "")
      .replace(/\u200b/g, "")
      .trim();
    const hasElement = Array.from(paragraph.childNodes).some(
      (node) => node.nodeType === Node.ELEMENT_NODE
    );

    if (text.length === 0 && !paragraph.querySelector("br") && !hasElement) {
      paragraph.appendChild(doc.createElement("br"));
    }
  });

  return body.innerHTML;
};
