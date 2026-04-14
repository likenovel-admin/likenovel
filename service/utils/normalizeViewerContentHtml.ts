const isBreakElement = (node: Node) =>
  node.nodeType === Node.ELEMENT_NODE &&
  (node as HTMLElement).tagName === "BR";

const isParagraphElement = (node: Node) =>
  node.nodeType === Node.ELEMENT_NODE &&
  (node as HTMLElement).tagName === "P";

const cloneParagraphAttributes = (
  source: HTMLElement,
  target: HTMLElement
) => {
  Array.from(source.attributes).forEach((attribute) => {
    target.setAttribute(attribute.name, attribute.value);
  });
};

const createBlankParagraph = (source: HTMLElement) => {
  const paragraph = document.createElement("p");
  cloneParagraphAttributes(source, paragraph);
  paragraph.appendChild(document.createElement("br"));
  return paragraph;
};

const isMeaningfulTextNode = (node: Node) =>
  node.nodeType === Node.TEXT_NODE && node.textContent !== "";

const hasMeaningfulLineContent = (nodes: Node[]) =>
  nodes.some((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent !== "";
    }

    return node.nodeType === Node.ELEMENT_NODE;
  });

const normalizeParagraphNode = (
  paragraph: HTMLElement,
  container: HTMLElement
) => {
  const childNodes = Array.from(paragraph.childNodes);
  const breakNodes = childNodes.filter(isBreakElement);
  const onlyVisualBreaks = childNodes.every(
    (node) => isBreakElement(node) || !isMeaningfulTextNode(node)
  );

  if (childNodes.length === 0 || onlyVisualBreaks) {
    const blankParagraphCount = Math.max(1, breakNodes.length);
    for (let index = 0; index < blankParagraphCount; index += 1) {
      container.appendChild(createBlankParagraph(paragraph));
    }
    return;
  }

  const lines: Node[][] = [[]];

  childNodes.forEach((node) => {
    if (isBreakElement(node)) {
      lines.push([]);
      return;
    }

    lines[lines.length - 1].push(node.cloneNode(true));
  });

  let paragraphLines: Node[][] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;

    const nextParagraph = document.createElement("p");
    cloneParagraphAttributes(paragraph, nextParagraph);

    paragraphLines.forEach((lineNodes, index) => {
      if (index > 0) {
        nextParagraph.appendChild(document.createElement("br"));
      }
      lineNodes.forEach((node) => {
        nextParagraph.appendChild(node);
      });
    });

    if (nextParagraph.childNodes.length === 0) {
      nextParagraph.appendChild(document.createElement("br"));
    }

    container.appendChild(nextParagraph);
    paragraphLines = [];
  };

  lines.forEach((lineNodes) => {
    if (hasMeaningfulLineContent(lineNodes)) {
      paragraphLines.push(lineNodes);
      return;
    }

    flushParagraph();
    container.appendChild(createBlankParagraph(paragraph));
  });

  flushParagraph();
};

export const normalizeViewerContentHtml = (html: string) => {
  if (typeof window === "undefined" || !html) return html;

  const source = document.createElement("div");
  source.innerHTML = html;

  const normalized = document.createElement("div");

  Array.from(source.childNodes).forEach((node) => {
    if (isParagraphElement(node)) {
      normalizeParagraphNode(node as HTMLElement, normalized);
      return;
    }

    normalized.appendChild(node.cloneNode(true));
  });

  return normalized.innerHTML;
};
