"use client";

import {
  IAiProductBrief,
  IRecommendProduct,
  IRecommendSection,
} from "@/app/api/query/recommendation/dto";
import {
  useGetAiProductBriefs,
  usePostAiSignalEvent,
} from "@/app/api/query/recommendation";
import {
  DEFAULT_PRODUCT_IMAGE,
  resolveProductCoverImage,
} from "@/constants/common";
import useMediaDevice from "@/hooks/useMediaDevice";
import useAuthStore from "@/store/authStore";
import {
  buildProductDetailPath,
  PRODUCT_DETAIL_ENTRY_SOURCE,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import CircleArrow from "../common/CircleArrow";

interface Props {
  section: IRecommendSection;
}

const SECTION_SUBTITLE = "회원님의 작품 읽기 패턴을 통해 골라드려요.";
const FALLBACK_PRODUCT_LABEL = "작품 키워드";
const PRODUCT_LABEL_LIMIT = 3;
const LOOP_PREVIEW_CARD_INDEX = 0;
const DEFAULT_DESKTOP_ITEMS_PER_PAGE = 4;
const MIN_DESKTOP_ITEMS_PER_PAGE = 1;
const DESKTOP_CARD_WIDTH = 259;
const DESKTOP_CARD_GAP = 16;
const DESKTOP_PREVIEW_WIDTH = 32;
const LOOP_SHIFT_WIDTH = DESKTOP_CARD_WIDTH - DESKTOP_PREVIEW_WIDTH;
const INTERNAL_AXIS_LABELS = new Set(["연", "타", "직", "타+직"]);
const GENERIC_LABEL_WORDS = new Set([
  "구좌",
  "작품",
  "조합",
  "주인공",
  "직업",
  "키워드",
  "타입",
  "유형",
]);

const normalizeLabel = (value: string) => value.replace(/\s+/g, " ").trim();
const normalizeLabelKey = (value: string) =>
  normalizeLabel(value).replace(/[^0-9A-Za-z가-힣]+/g, "");
const getComparableWords = (value: string) =>
  normalizeLabel(value)
    .replace(/[^0-9A-Za-z가-힣]+/g, " ")
    .split(" ")
    .filter((word) => word.length >= 2);

const isVisibleTasteTag = (value: string) => {
  const label = normalizeLabel(value);
  if (!label || INTERNAL_AXIS_LABELS.has(label)) return false;
  return !/^[가-힣A-Za-z]{1,2}(?:\+[가-힣A-Za-z]{1,2})+$/.test(label);
};

const isSlotTitleDuplicateLabel = (label: string, slotTitle: string) => {
  const labelKey = normalizeLabelKey(label);
  const slotTitleKey = normalizeLabelKey(slotTitle);
  if (labelKey && slotTitleKey.includes(labelKey)) return true;

  const slotTitleWords = new Set(getComparableWords(slotTitle));
  const labelWords = getComparableWords(label).filter(
    (word) => !GENERIC_LABEL_WORDS.has(word)
  );
  return (
    labelWords.length > 0 &&
    labelWords.every((word) => slotTitleWords.has(word))
  );
};

const getBriefKeywordCandidates = (brief?: IAiProductBrief) => [
  ...(brief?.librarianChips || []),
  ...(brief?.tasteTags || []),
  ...(brief?.worldviewTags || []),
  ...(brief?.styleTags || []),
  ...(brief?.protagonistTypeTags || []),
  ...(brief?.protagonistJobTags || []),
  ...(brief?.protagonistMaterialTags || []),
  ...(brief?.romanceTags || []),
];

const getProductLabels = (
  product: IRecommendProduct,
  brief: IAiProductBrief | undefined,
  slotTitle: string
) => {
  const labels: string[] = [];
  const seenLabelKeys = new Set<string>();

  for (const tag of [
    ...getBriefKeywordCandidates(brief),
    ...(product.tasteTags || []),
  ]) {
    if (
      !isVisibleTasteTag(tag) ||
      isSlotTitleDuplicateLabel(tag, slotTitle)
    ) {
      continue;
    }

    const label = normalizeLabel(tag);
    const labelKey = normalizeLabelKey(label);
    if (!labelKey || seenLabelKeys.has(labelKey)) continue;

    seenLabelKeys.add(labelKey);
    labels.push(label);
    if (labels.length >= PRODUCT_LABEL_LIMIT) break;
  }

  return labels.length ? labels : [FALLBACK_PRODUCT_LABEL];
};

const formatEpisodeBadge = (episodeCount: number) => {
  if (!Number.isFinite(episodeCount) || episodeCount <= 0) return null;
  return `${Math.floor(episodeCount)}화`;
};

function getLoopedProducts<T>(items: T[], startIndex: number, count: number) {
  if (!items.length) return [];

  return Array.from({ length: count }, (_, offset) => {
    const nextIndex = (startIndex + offset + items.length) % items.length;
    return items[nextIndex];
  });
}

const getResponsiveItemsPerPage = (
  containerWidth: number,
  viewportWidth = containerWidth
) => {
  const availableWidth = Math.min(
    containerWidth,
    viewportWidth - DESKTOP_PREVIEW_WIDTH * 2
  );

  if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
    return DEFAULT_DESKTOP_ITEMS_PER_PAGE;
  }

  return Math.min(
    DEFAULT_DESKTOP_ITEMS_PER_PAGE,
    Math.max(
      MIN_DESKTOP_ITEMS_PER_PAGE,
      Math.floor(
        (availableWidth - DESKTOP_PREVIEW_WIDTH + DESKTOP_CARD_GAP) /
          (DESKTOP_CARD_WIDTH + DESKTOP_CARD_GAP)
      )
    )
  );
};

const getLoopViewportWidth = (itemsPerPage: number) =>
  itemsPerPage * DESKTOP_CARD_WIDTH +
  Math.max(0, itemsPerPage - 1) * DESKTOP_CARD_GAP +
  DESKTOP_PREVIEW_WIDTH * 2;

const SparkleIcon = () => (
  <svg
    aria-hidden="true"
    className="h-18pxr w-18pxr flex-shrink-0 text-primary-100"
    viewBox="0 0 20 20"
    fill="none"
  >
    <path
      d="M9.1 2.4 7.6 7.2 3 8.8l4.6 1.6 1.5 4.8 1.6-4.8 4.6-1.6-4.6-1.6-1.6-4.8Z"
      fill="currentColor"
    />
    <path
      d="m15.4 1.8-.7 2.1-2 .7 2 .7.7 2.1.7-2.1 2-.7-2-.7-.7-2.1Z"
      fill="currentColor"
      opacity=".58"
    />
  </svg>
);

const TasteSection = ({ section }: Props) => {
  const router = useRouter();
  const device = useMediaDevice();
  const sectionMeasureRef = useRef<HTMLElement | null>(null);
  const { isAuthenticated, accessToken, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
    user: state.user,
  }));
  const { mutate: postSignalEvent } = usePostAiSignalEvent();
  const [currentPage, setCurrentPage] = useState(0);
  const [desktopItemsPerPage, setDesktopItemsPerPage] = useState(
    DEFAULT_DESKTOP_ITEMS_PER_PAGE
  );
  const [brokenCoverProductIds, setBrokenCoverProductIds] = useState<
    Record<number, true>
  >({});
  const isDesktop = device === "desktop";
  const itemsPerPage = isDesktop
    ? desktopItemsPerPage
    : section.products.length;
  const adultYn = user?.isOnAdult ? "Y" : "N";
  const canTrackAiTasteClick = Boolean(isAuthenticated || accessToken);
  const sortedProducts = useMemo(
    () =>
      [...section.products].sort(
        (a, b) => b.episodeCount - a.episodeCount
      ),
    [section.products]
  );
  const productIds = useMemo(
    () => sortedProducts.map((product) => product.productId),
    [sortedProducts]
  );
  const { data: aiBriefsData } = useGetAiProductBriefs(
    productIds,
    adultYn,
    productIds.length > 0
  );
  const aiBriefsByProductId = useMemo(
    () =>
      new Map(
        (aiBriefsData?.data ?? []).map((brief) => [brief.productId, brief])
      ),
    [aiBriefsData]
  );

  useEffect(() => {
    const target = sectionMeasureRef.current;
    if (!target) return;

    const updateItemsPerPage = () => {
      setDesktopItemsPerPage(
        getResponsiveItemsPerPage(
          target.getBoundingClientRect().width,
          window.innerWidth
        )
      );
    };

    updateItemsPerPage();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateItemsPerPage);
      return () => window.removeEventListener("resize", updateItemsPerPage);
    }

    const resizeObserver = new ResizeObserver(updateItemsPerPage);
    resizeObserver.observe(target);
    return () => resizeObserver.disconnect();
  }, []);

  if (!section.products.length) return null;

  const title = section.title?.trim() ? section.title : "AI 추천 작품";
  const parts = title.split(/'([^']+)'/g);
  const slotTitle =
    parts.length <= 1
      ? title
      : parts.map((part, index) =>
          index % 2 === 1 ? (
            <span
              key={`slot-title-highlight-${index}`}
              className="text-primary-100"
            >
              {part}
            </span>
          ) : (
            <Fragment key={`slot-title-text-${index}`}>{part}</Fragment>
          )
        );
  const totalItems = sortedProducts.length;
  const isLoopEnabled = isDesktop && totalItems > itemsPerPage;
  const currentProducts = isLoopEnabled
    ? getLoopedProducts(sortedProducts, currentPage - 1, itemsPerPage + 2)
    : isDesktop
      ? sortedProducts.slice(0, itemsPerPage)
      : sortedProducts;
  const showArrows = isLoopEnabled;
  const loopViewportStyle = isLoopEnabled
    ? ({
        "--ai-taste-loop-width": `${getLoopViewportWidth(itemsPerPage)}px`,
        "--ai-taste-loop-shift": `-${LOOP_SHIFT_WIDTH}px`,
      } as CSSProperties)
    : undefined;

  const handlePrevPage = () => {
    if (!isLoopEnabled) return;
    setCurrentPage((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const handleNextPage = () => {
    if (!isLoopEnabled) return;
    setCurrentPage((prev) => (prev + 1) % totalItems);
  };

  return (
    <section ref={sectionMeasureRef} className="relative max-w-[1120px]">
      <div className="px-16pxr md:px-0">
        <h3 className="text-20pxr md:text-24pxr font-bold leading-[28px] md:leading-[34px] text-black-100">
          {slotTitle}
        </h3>
        <p className="mt-4pxr flex items-center gap-4pxr text-14pxr md:text-15pxr leading-[22px] text-dark-gray-400">
          <SparkleIcon />
          <span>{SECTION_SUBTITLE}</span>
        </p>
      </div>

      <div
        style={loopViewportStyle}
        className={`relative mt-16pxr ${
          isLoopEnabled
            ? "lg:mx-auto lg:w-[var(--ai-taste-loop-width)] lg:overflow-hidden"
            : ""
        }`}
      >
        <div
          className={`flex gap-12pxr md:gap-16pxr scroll-hidden overflow-x-auto lg:overflow-hidden pl-16pxr pr-16pxr md:px-0 ${
            isLoopEnabled ? "lg:translate-x-[var(--ai-taste-loop-shift)]" : ""
          }`}
        >
          {currentProducts.map((product, renderedIndex) => {
            const isLoopPreviewCard =
              isLoopEnabled &&
              (renderedIndex === LOOP_PREVIEW_CARD_INDEX ||
                renderedIndex === currentProducts.length - 1);
            const isCoverBroken = Boolean(
              brokenCoverProductIds[product.productId]
            );
            const coverImageSrc = resolveProductCoverImage(product.coverUrl);
            const isDefaultCoverImage =
              coverImageSrc === DEFAULT_PRODUCT_IMAGE;
            const productLabels = getProductLabels(
              product,
              aiBriefsByProductId.get(product.productId),
              title
            );
            const episodeBadge = formatEpisodeBadge(product.episodeCount);

            return (
              <button
                key={`${product.productId}-${renderedIndex}`}
                type="button"
                tabIndex={isLoopPreviewCard ? -1 : undefined}
                aria-hidden={isLoopPreviewCard || undefined}
                className={`relative h-[326px] w-[212px] flex-shrink-0 overflow-hidden rounded-[20px] bg-light-gray-100 pt-34pxr text-center md:h-[382px] md:w-[259px] md:pt-48pxr ${
                  isLoopPreviewCard
                    ? "pointer-events-none"
                    : "cursor-pointer"
                }`}
                onClick={() => {
                  if (isLoopPreviewCard) return;
                  if (canTrackAiTasteClick) {
                    postSignalEvent({
                      product_id: product.productId,
                      event_type: "taste_slot_click",
                      event_payload: {
                        source: "ai_taste_section",
                        slot_title: section.title,
                        slot_dimension: section.dimension,
                      },
                    });
                  }
                  setPendingProductDetailEntrySource(
                    product.productId,
                    PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION
                  );
                  router.push(
                    buildProductDetailPath(product.productId, {
                      entrySource: PRODUCT_DETAIL_ENTRY_SOURCE.AI_TASTE_SECTION,
                    })
                  );
                }}
              >
                <div className="absolute left-1/2 top-34pxr h-[196px] w-[212px] -translate-x-1/2 rotate-180 opacity-30 blur-[30px] md:top-48pxr md:h-[228px] md:w-[259px]">
                  <Image
                    src={coverImageSrc}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 212px, 259px"
                    unoptimized={isDefaultCoverImage}
                    className="object-cover"
                  />
                </div>

                <div className="relative z-10 mx-auto h-[190px] w-[132px] overflow-hidden rounded-[8px] bg-light-gray-200 shadow-[0_1px_2px_rgba(17,19,23,0.12)] md:h-[224px] md:w-[160px]">
                  {!isCoverBroken && !isDefaultCoverImage ? (
                    <Image
                      src={coverImageSrc}
                      alt={product.title}
                      fill
                      sizes="(max-width: 767px) 132px, 160px"
                      className="object-cover"
                      onError={() =>
                        setBrokenCoverProductIds((prev) => ({
                          ...prev,
                          [product.productId]: true,
                        }))
                      }
                    />
                  ) : (
                    <Image
                      src={DEFAULT_PRODUCT_IMAGE}
                      alt={product.title}
                      fill
                      sizes="(max-width: 767px) 132px, 160px"
                      unoptimized
                      loading="eager"
                      className="object-cover"
                    />
                  )}
                  {episodeBadge && (
                    <span className="absolute right-[-6px] top-14pxr min-w-[42px] rounded-full bg-white px-8pxr py-5pxr text-12pxr font-bold leading-[16px] text-dark-gray-400 shadow-[0_2px_8px_rgba(17,19,23,0.12)]">
                      {episodeBadge}
                    </span>
                  )}
                </div>

                <div
                  className={`relative z-10 mt-16pxr flex w-full flex-col items-center px-16pxr ${
                    isLoopPreviewCard ? "invisible" : ""
                  }`}
                >
                  <div className="flex h-22pxr max-w-full items-center justify-center gap-4pxr overflow-hidden">
                    {productLabels.map((productLabel) => (
                      <span
                        key={productLabel}
                        className="inline-flex h-22pxr min-w-0 max-w-[58px] items-center justify-center rounded-full border border-dark-gray-300 px-7pxr text-11pxr font-medium leading-[18px] text-dark-gray-400 md:max-w-[72px]"
                      >
                        <span className="truncate">{productLabel}</span>
                      </span>
                    ))}
                  </div>
                  <p className="mt-8pxr w-full truncate text-16pxr font-bold leading-[24px] text-black-100">
                    {product.title}
                  </p>
                  {product.authorNickname && (
                    <p className="mt-4pxr w-full truncate text-14pxr leading-[20px] text-dark-gray-400">
                      {product.authorNickname}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {isLoopEnabled && (
          <>
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 hidden w-72pxr bg-gradient-to-l from-white/0 to-white lg:block" />
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 hidden w-72pxr bg-gradient-to-r from-white/0 to-white lg:block" />
          </>
        )}

        {showArrows && (
          <>
            <div className="absolute left-[32px] top-1/2 z-20 hidden -translate-y-1/2 lg:block">
              <CircleArrow
                direction="left"
                onClick={handlePrevPage}
                isDisabled={false}
              />
            </div>
            <div className="absolute right-[32px] top-1/2 z-20 hidden -translate-y-1/2 lg:block">
              <CircleArrow
                direction="right"
                onClick={handleNextPage}
                isDisabled={false}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default TasteSection;
