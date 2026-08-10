import {
  resolveViewerAppearance,
  type ViewerAppearanceSettings,
} from "./viewerAppearance.ts";

interface EpisodePreviewDocumentInput {
  title: string;
  contentHtml: string;
  settings: ViewerAppearanceSettings;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const RENDERABLE_IMAGE_PATTERN =
  /<img\b[^>]*\bsrc\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/i;
const INVISIBLE_HTML_ENTITY_PATTERN =
  /&(?:nbsp|#0*160|#x0*a0|ZeroWidthSpace|#0*8203|#x0*200b|#0*65279|#x0*feff);/gi;

export const hasRenderableEpisodePreviewContent = (contentHtml: string) => {
  if (RENDERABLE_IMAGE_PATTERN.test(contentHtml)) return true;

  const visibleText = contentHtml
    .replace(/<br\b[^>]*\/?\s*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(INVISIBLE_HTML_ENTITY_PATTERN, "")
    .replace(/[\s\u00a0\u200b\ufeff]/g, "");

  return visibleText.length > 0;
};

export const buildEpisodePreviewDocument = ({
  title,
  contentHtml,
  settings,
}: EpisodePreviewDocumentInput) => {
  const appearance = resolveViewerAppearance(settings);
  const previewTitle = escapeHtml(`${title || "회차"} 미리보기`);

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; object-src 'none'; frame-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'; img-src http: https: data: blob:; font-src 'self' http: https: data:; style-src 'unsafe-inline'">
    <title>${previewTitle}</title>
    <style>
      @font-face { font-family: "NanumMyeongjo"; src: url("/fonts/NanumMyeongjo-Regular.woff2") format("woff2"); }
      @font-face { font-family: "MaruBuri"; src: url("/fonts/MaruBuri-Regular.woff2") format("woff2"); }
      @font-face { font-family: "Pretendard"; src: url("/fonts/PretendardVariable.woff2") format("woff2"); }
      @font-face { font-family: "JoseonPalace"; src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@1.0/ChosunGs.woff") format("woff"); }
      @font-face { font-family: "NanumGothic"; src: url("https://fonts.gstatic.com/ea/nanumgothic/v5/NanumGothic-Regular.woff2") format("woff2"); }
      @font-face { font-family: "NotoSansKR"; src: url("https://fonts.gstatic.com/ea/notosanskr/v2/NotoSansKR-Regular.woff2") format("woff2"); }
      @font-face { font-family: "KoPubDotum"; src: url("https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/KoPubDotumMedium.woff") format("woff"); }
      *, *::before, *::after { box-sizing: border-box; }
      html, body {
        min-height: 100%;
        margin: 0;
        background: ${appearance.backgroundColor};
        color: ${appearance.textColor};
      }
      body {
        font-family: "${appearance.fontFamily}";
        font-size: ${appearance.fontSize};
        letter-spacing: ${appearance.letterSpacing};
        line-height: ${appearance.lineHeight};
        tab-size: 4;
      }
      main {
        width: 100%;
        max-width: ${appearance.desktopScrolledMaxWidth};
        min-height: 100dvh;
        margin: 0 auto;
        padding: max(32px, env(safe-area-inset-top)) 24px max(48px, env(safe-area-inset-bottom));
      }
      p {
        margin: 0 0 0.15em;
        line-height: ${appearance.lineHeight};
        text-indent: ${appearance.paragraphIndent};
        tab-size: 4;
      }
      p:has(> br:only-child) {
        min-height: ${appearance.lineHeight};
        margin: 0;
        text-indent: 0;
      }
      img { display: block; max-width: 100%; height: auto; }
      @media (max-width: 767px) {
        main {
          width: calc(100vw - ${appearance.mobileHorizontalGap});
          padding-left: 0;
          padding-right: 0;
        }
      }
    </style>
  </head>
  <body>
    <main>${contentHtml}</main>
  </body>
</html>`;
};
