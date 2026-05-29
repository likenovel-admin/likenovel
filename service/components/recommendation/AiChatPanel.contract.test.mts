import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./AiChatPanel.tsx", import.meta.url),
  "utf8"
);

assert.ok(
  source.includes(
    'const isProductDetailPage = /^\\/product\\/\\d+$/.test(pathname ?? "");'
  )
);
assert.ok(source.includes('? "bottom-[96px] md:bottom-[98px]"'));
assert.ok(source.includes(': "bottom-20pxr";'));
assert.match(source, /className=\{`fixed \$\{floatingButtonBottomClassName\}/);
assert.match(source, /right-4 md:right-6 z-40/);
assert.doesNotMatch(source, /right-4 md:right-6 z-\[70\] w-\[50px\]/);
assert.match(source, /aria-label=\{isOpen \? "AI 사서 닫기" : "AI 사서 열기"\}/);
assert.match(source, /openAiLibrarianPanel/);
assert.doesNotMatch(source, /openAiLibrarianPanelOrLogin/);
assert.match(source, /consumeQueuedAiLibrarianProductQuestion/);
assert.match(source, /pendingProductQuestion/);
assert.match(source, /consumePendingProductQuestion/);
assert.match(source, /handleRecommend\(undefined, pendingProductQuestion\.prompt/);
assert.match(source, /contextProductId\?: number/);
assert.match(source, /focusProductCard\?: boolean/);
assert.match(source, /current_product_id: options\?\.contextProductId \?\? pageContext\.current_product_id/);
assert.match(source, /focus_product_card: Boolean\(options\?\.focusProductCard\)/);
assert.match(
  source,
  /const queuedProductQuestion = consumeQueuedAiLibrarianProductQuestion\(pageContext\.current_product_id\)/
);
assert.match(source, /if \(shouldOpenAfterLogin\) \{/);
assert.match(source, /if \(queuedProductQuestion\) \{/);
assert.match(source, /requestProductQuestion\(queuedProductQuestion\)/);
assert.match(source, /resetSession: true/);
assert.match(source, /focusProductCard: true/);
assert.match(source, /exclude_product_ids: options\?\.resetSession \? \[\] : excludeIds/);
assert.doesNotMatch(source, /exclude_product_ids: excludeIds/);
assert.match(source, /className="fixed inset-0 z-\[70\] bg-black\/30"/);
assert.match(source, /className=\{`fixed top-0 right-0 z-\[80\]/);
assert.doesNotMatch(source, /router\.push\(["']\/websochat/);
