import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL("./AiChatPanel.tsx", import.meta.url),
  "utf8"
);
const deferredModalSource = readFileSync(
  new URL("../common/GlobalDeferredModals.tsx", import.meta.url),
  "utf8"
);
const layoutSource = readFileSync(
  new URL("../../app/layout.tsx", import.meta.url),
  "utf8"
);
const dtoSource = readFileSync(
  new URL("../../app/api/query/recommendation/dto.ts", import.meta.url),
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
assert.match(source, /isOpen \? "z-\[90\] pointer-events-none opacity-0" : "z-\[130\]"/);
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
assert.match(source, /const AI_CHAT_CONTEXT_MESSAGE_LIMIT = 12/);
assert.match(source, /messages\.slice\(-AI_CHAT_CONTEXT_MESSAGE_LIMIT\)/);
assert.match(source, /const activeFocusProductId = useMemo/);
assert.match(source, /const activeContextProductId = options\?\.resetSession \? undefined : activeFocusProductId/);
assert.match(source, /const requestCurrentProductId =/);
assert.match(source, /current_product_id: requestCurrentProductId/);
assert.match(source, /active_focus_product_id: options\?\.contextProductId \?\? activeContextProductId/);
assert.match(dtoSource, /active_focus_product_id\?: number/);
assert.match(source, /focus_product_card: Boolean\(options\?\.focusProductCard\)/);
assert.match(source, /const shouldShowPresetChips = messages\.length === 0/);
assert.match(source, /\{shouldShowPresetChips && \(/);
assert.match(
  source,
  /const queuedProductQuestion = consumeQueuedAiLibrarianProductQuestion\(pageContext\.current_product_id\)/
);
assert.match(source, /if \(shouldOpenAfterLogin\) \{/);
assert.match(source, /if \(queuedProductQuestion\) \{/);
assert.match(source, /requestProductQuestion\(queuedProductQuestion\)/);
assert.match(source, /resetSession: true/);
assert.match(source, /focusProductCard: true/);
assert.match(source, /ignoreExcludeIds\?: boolean/);
assert.match(source, /exclude_product_ids: options\?\.ignoreExcludeIds \|\| options\?\.resetSession \? \[\] : excludeIds/);
assert.doesNotMatch(source, /exclude_product_ids: excludeIds/);
assert.match(source, /className="fixed inset-0 z-\[110\] bg-black\/30"/);
assert.match(source, /\{isOpen && \(\s*<div className="fixed top-0 right-0 z-\[120\]/);
assert.doesNotMatch(source, /translate-x-full/);
assert.match(source, /const buildCardDisplayTags = \(product: IProductCardTagSource\)/);
assert.match(source, /\.\.\.\(product\.matchTags \|\| \[\]\)/);
assert.match(source, /\.\.\.\(product\.protagonistJobTags \|\| \[\]\)/);
assert.match(source, /\.\.\.\(product\.tasteTags \|\| \[\]\)/);
assert.ok(
  source.indexOf("...(product.matchTags || [])") <
    source.indexOf("...(product.protagonistJobTags || [])"),
  "AI chat product card should show server-selected match tags first"
);
assert.ok(
  source.indexOf("...(product.protagonistJobTags || [])") <
    source.indexOf("...(product.tasteTags || [])"),
  "AI chat product card should show protagonist/job evidence before generic taste tags"
);
assert.match(source, /whitespace-pre-wrap break-words/);
assert.match(source, /leading-\[1\.6\]/);
assert.match(source, /const FOLLOW_UP_QUESTION_LIMIT = 4/);
assert.match(source, /const FOLLOW_UP_QUESTION_MIN = 3/);
assert.match(source, /type IProductFollowUpQuestion = IAiSuggestedAction/);
assert.match(source, /const getSuggestedActionPriority = \(action: IAiSuggestedAction\)/);
assert.match(source, /Number\.isFinite\(priority\)/);
assert.match(source, /const sortSuggestedActions = \(actions: IAiSuggestedAction\[\]\)/);
assert.match(source, /const normalizeSuggestedActionsForRender = \(actions\?: IAiSuggestedAction\[\]\)/);
assert.match(source, /actions\.length < FOLLOW_UP_QUESTION_MIN \|\| actions\.length > FOLLOW_UP_QUESTION_LIMIT/);
assert.match(source, /const buildProductFollowUpQuestions = \(\s*product: IRecommendProduct,\s*suggestedActions\?: IAiSuggestedAction\[\]\s*\)/);
assert.match(source, /suggestedActions\?: IAiSuggestedAction\[\]/);
assert.match(source, /const serverActions = normalizeSuggestedActionsForRender\(suggestedActions\)/);
assert.match(source, /actionId: "explain_match"/);
assert.match(source, /priority: 10/);
assert.match(source, /label: "왜 제 취향에 맞나요\?"/);
assert.match(source, /actionId: "explain_entry"/);
assert.match(source, /priority: 20/);
assert.match(source, /label: "초반 진입 포인트는\?"/);
assert.match(source, /actionId: "explain_attribute"/);
assert.match(source, /priority: 30/);
assert.match(source, /label: primaryTag \? `#\$\{primaryTag\} 포인트가 뭐예요\?` : "추천 근거가 뭐예요\?"/);
assert.match(source, /actionId: "recommend_similar"/);
assert.match(source, /priority: 40/);
assert.match(source, /label: "비슷한 작품도 더 볼래요"/);
assert.match(source, /return a\.label\.length - b\.label\.length/);
assert.match(source, /<AiChatProductFollowUps/);
assert.match(source, /const AiChatStandaloneFollowUps = \(\{/);
assert.match(source, /message\.role === "assistant" && !message\.product/);
assert.match(source, /<AiChatStandaloneFollowUps/);
assert.match(source, /event\.stopPropagation\(\)/);
assert.match(source, /className="mt-10pxr flex flex-col items-start gap-8pxr"/);
assert.match(source, /className="mt-8pxr flex flex-col items-start gap-8pxr"/);
assert.match(source, /bg-gradient-to-r from-light-gray-100 to-light-gray-200/);
assert.match(source, /text-left text-14pxr/);
assert.match(source, /suggestedActions: data\.suggestedActions/);
assert.match(source, /suggestedActions=\{message\.suggestedActions\}/);
assert.match(source, /const focusProductCard = question\.intent !== "recommend_similar"/);
assert.match(source, /const pendingFollowUpActionRef = useRef<string \| null>\(null\)/);
assert.match(source, /sourceActionId\?: string/);
assert.match(source, /sourceActionIntent\?: IAiSuggestedAction\["intent"\]/);
assert.match(source, /pendingFollowUpActionRef\.current === sourceActionId/);
assert.match(source, /source_action_id: sourceActionId/);
assert.match(source, /source_action_intent: options\?\.sourceActionIntent/);
assert.match(source, /const sourceActionId = question\.actionId \|\| question\.id \|\| `\$\{question\.intent\}:\$\{question\.topic \|\| ""\}:\$\{question\.label\}`/);
assert.match(source, /handleRecommend\(undefined, question\.userMessage \|\| question\.label/);
assert.match(source, /sourceActionId,/);
assert.match(source, /sourceActionIntent: question\.intent/);
assert.doesNotMatch(source, /ignoreExcludeIds: question\.keepCurrentProduct/);
assert.match(source, /const AiChatLoadingSkeleton = \(\) =>/);
assert.match(source, /role="status" aria-label="AI가 작품을 찾고 있어요"/);
assert.match(source, /w-\[70px\] h-\[98px\] flex-shrink-0 rounded-lg bg-light-gray-300/);
assert.match(source, /mt-10pxr flex flex-col items-start gap-8pxr animate-pulse/);
assert.match(source, /<AiChatLoadingSkeleton \/>/);
assert.doesNotMatch(source, /<span className="ml-8pxr text-13pxr text-dark-gray-400">AI가 작품을 찾고 있어요\.\.\.<\/span>/);
assert.doesNotMatch(source, /router\.push\(["']\/websochat/);
assert.match(
  deferredModalSource,
  /const AiChatPanel = dynamic\(\(\) => import\("@\/components\/recommendation\/AiChatPanel"\), \{\s*ssr: false,\s*\}\);/,
  "AiChatPanel should be deferred out of the root layout bundle"
);
assert.match(
  deferredModalSource,
  /const SearchModal = dynamic\(\(\) => import\("@\/components\/search\/SearchModal"\), \{\s*ssr: false,\s*\}\);/,
  "SearchModal should be deferred out of the root layout bundle"
);
assert.match(
  layoutSource,
  /<GlobalDeferredModals \/>/,
  "Root layout should mount deferred global modals through one client boundary"
);
assert.doesNotMatch(
  layoutSource,
  /import AiChatPanel from "@\/components\/recommendation\/AiChatPanel"/,
  "Root layout should not statically import AiChatPanel"
);
assert.doesNotMatch(
  layoutSource,
  /import SearchModal from "@\/components\/search\/SearchModal"/,
  "Root layout should not statically import SearchModal"
);
