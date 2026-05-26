export const normalizeViewerContentHtml = (html: string): string => {
  if (!html) return html;

  const normalizeParagraph = (attrs: string, content: string) => {
    const isVisuallyBlank = (value: string) => {
      const hasNonBrElement = /<(?!br\b)[a-z][^>]*>/i.test(value);
      const visibleText = value
        .replace(/<br\b[^>]*\/?>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/gi, "")
        .replace(/\u00a0/g, "")
        .replace(/\u200b/g, "")
        .replace(/\uFEFF/g, "")
        .trim();

      return visibleText.length === 0 && !hasNonBrElement;
    };

    const renderSplitParagraphs = (value: string) =>
      /<([a-z][\w:-]*)(?:\s[^>]*)?>[\s\S]*?<br\b[^>]*\/?>[\s\S]*?<\/\1>/i.test(
        value
      )
        ? `<p${attrs}>${value}</p>`
        : value
            .split(/<br\b[^>]*\/?>/gi)
            .map((part) =>
              isVisuallyBlank(part)
                ? `<p${attrs}><br></p>`
                : `<p${attrs}>${part}</p>`
            )
            .join("");

    const withoutStorageOnlyBreaks = content.replace(
      /<br\b(?=[^>]*\bclass=(["'])[^"']*\bProseMirror-trailingBreak\b[^"']*\1)[^>]*\/?>/gi,
      ""
    );

    if (isVisuallyBlank(withoutStorageOnlyBreaks)) {
      return `<p${attrs}><br></p>`;
    }

    const withoutTerminalBreaks = withoutStorageOnlyBreaks.replace(
      /(?:\s*<br\b[^>]*\/?>\s*)+$/gi,
      ""
    );
    const leadingBreaks = withoutTerminalBreaks.match(
      /^(\s*(?:<br\b[^>]*\/?>\s*)+)([\s\S]*\S[\s\S]*)$/i
    );

    if (leadingBreaks) {
      const blankParagraphs = (
        leadingBreaks[1].match(/<br\b[^>]*\/?>/gi) || []
      )
        .map(() => `<p${attrs}><br></p>`)
        .join("");

      return `${blankParagraphs}${renderSplitParagraphs(
        leadingBreaks[2].replace(/^\s+/, "")
      )}`;
    }

    return renderSplitParagraphs(withoutTerminalBreaks);
  };

  if (typeof DOMParser === "undefined") {
    return html.replace(
      /<p\b([^>]*)>([\s\S]*?)<\/p>/gi,
      (_match, attrs: string, content: string) =>
        normalizeParagraph(attrs, content)
    );
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, "text/html");
  const body = doc.body;

  body.querySelectorAll("p").forEach((paragraph) => {
    paragraph
      .querySelectorAll("br.ProseMirror-trailingBreak")
      .forEach((node) => {
        node.remove();
      });

    const text = (paragraph.textContent || "")
      .replace(/\u00a0/g, "")
      .replace(/\u200b/g, "")
      .replace(/\uFEFF/g, "")
      .trim();
    const hasNonBrElement = Array.from(paragraph.childNodes).some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node as Element).tagName !== "BR"
    );

    if (text.length === 0 && !hasNonBrElement) {
      paragraph.replaceChildren(doc.createElement("br"));
      return;
    }

    while (paragraph.lastElementChild?.tagName === "BR") {
      paragraph.lastElementChild.remove();
    }
  });

  return body.innerHTML.replace(
    /<p\b([^>]*)>([\s\S]*?)<\/p>/gi,
    (_match, attrs: string, content: string) =>
      normalizeParagraph(attrs, content)
  );
};
