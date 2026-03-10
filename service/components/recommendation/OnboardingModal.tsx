"use client";

import {
  useGetOnboardingProducts,
  usePostOnboarding,
  usePostOnboardingDismiss,
} from "@/app/api/query/recommendation";
import {
  IOnboardingProduct,
  IOnboardingTagTab,
} from "@/app/api/query/recommendation/dto";
import Button from "@/components/common/Button";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dismissOnClose?: boolean;
}

type OnboardingTagTab = "hero" | "worldTone" | "relation";
type SelectedTagState = Record<OnboardingTagTab, string[]>;

const toTagList = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const OnboardingModal = ({
  isOpen,
  onClose,
  dismissOnClose = false,
}: Props) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [analysisType, setAnalysisType] = useState("맞춤");
  const [analysisSummary, setAnalysisSummary] = useState("");
  const [activeTagTab, setActiveTagTab] = useState<OnboardingTagTab>("hero");
  const [selectedTags, setSelectedTags] = useState<SelectedTagState>({
    hero: [],
    worldTone: [],
    relation: [],
  });
  const [brokenCoverProductIds, setBrokenCoverProductIds] = useState<
    Record<number, true>
  >({});

  const { data: onboardingData } = useGetOnboardingProducts();
  const { mutateAsync: postOnboarding, isPending } = usePostOnboarding();
  const { mutateAsync: dismissOnboarding } = usePostOnboardingDismiss();
  const queryClient = useQueryClient();

  const products: IOnboardingProduct[] = useMemo(
    () => onboardingData?.data ?? [],
    [onboardingData]
  );
  const tagTabs = useMemo(() => {
    if (onboardingData?.tag_tabs?.length) {
      return onboardingData.tag_tabs;
    }

    const heroTagCount = new Map<string, number>();
    const worldToneTagCount = new Map<string, number>();
    const relationTagCount = new Map<string, number>();

    const increaseCount = (counter: Map<string, number>, tag: string) => {
      const normalized = tag.trim();
      if (!normalized) return;
      counter.set(normalized, (counter.get(normalized) || 0) + 1);
    };

    products.forEach((product) => {
      toTagList(product.protagonist_type_tags).forEach((tag) =>
        increaseCount(heroTagCount, tag)
      );
      toTagList(product.protagonist_job_tags).forEach((tag) =>
        increaseCount(heroTagCount, tag)
      );
      toTagList(product.protagonist_material_tags).forEach((tag) =>
        increaseCount(heroTagCount, tag)
      );
      toTagList(product.worldview_tags).forEach((tag) =>
        increaseCount(worldToneTagCount, tag)
      );
      toTagList(product.axis_style_tags).forEach((tag) =>
        increaseCount(worldToneTagCount, tag)
      );
      toTagList(product.axis_romance_tags).forEach((tag) =>
        increaseCount(relationTagCount, tag)
      );
    });

    const toItems = (counter: Map<string, number>, limit: number) =>
      Array.from(counter.entries())
        .sort((a, b) => (b[1] === a[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]))
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count }));

    return [
      { key: "hero", label: "주인공", tags: toItems(heroTagCount, 30) },
      { key: "worldTone", label: "세계관/분위기", tags: toItems(worldToneTagCount, 30) },
      { key: "relation", label: "관계/기타", tags: toItems(relationTagCount, 24) },
    ] as IOnboardingTagTab[];
  }, [onboardingData, products]);

  const activeTags = useMemo(
    () => tagTabs.find((tab) => tab.key === activeTagTab)?.tags ?? [],
    [tagTabs, activeTagTab]
  );
  const totalSelectedTagCount = useMemo(
    () =>
      selectedTags.hero.length +
      selectedTags.worldTone.length +
      selectedTags.relation.length,
    [selectedTags]
  );

  const fallbackType = useMemo(() => {
    if (selectedTags.hero.length > 0) {
      return selectedTags.hero[0];
    }
    return "맞춤";
  }, [selectedTags.hero]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedProducts([]);
      setAnalysisType("맞춤");
      setAnalysisSummary("");
      setActiveTagTab("hero");
      setSelectedTags({ hero: [], worldTone: [], relation: [] });
      setBrokenCoverProductIds({});
    }
  }, [isOpen]);

  const toggleProduct = useCallback((productId: number) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, productId];
    });
  }, []);
  const toggleTag = useCallback((tab: OnboardingTagTab, tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev[tab]);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return {
        ...prev,
        [tab]: Array.from(next),
      };
    });
  }, []);

  const handleRequestClose = async () => {
    if (step === 2 && isPending) return;
    if (dismissOnClose && step !== 3) {
      try {
        await dismissOnboarding();
        queryClient.invalidateQueries({
          queryKey: ["tasteRecommendations"],
        });
      } catch (error) {
        console.error("onboarding dismiss failed", error);
      }
    }
    onClose();
  };

  const handleSelect = async () => {
    if ((selectedProducts.length === 0 && totalSelectedTagCount === 0) || isPending) {
      return;
    }

    setStep(2);
    try {
      const response = await postOnboarding({
        product_ids: selectedProducts,
        moods: [],
        hero_tags: selectedTags.hero,
        world_tone_tags: selectedTags.worldTone,
        relation_tags: selectedTags.relation,
      });

      const dominantType = response?.data?.dominant_type || fallbackType;
      const summary =
        response?.data?.taste_summary ||
        "선택한 작품과 태그를 바탕으로 추천 구좌를 구성했어요.";

      setAnalysisType(dominantType);
      setAnalysisSummary(summary);

      queryClient.invalidateQueries({
        queryKey: ["tasteRecommendations"],
      });
      queryClient.invalidateQueries({ queryKey: ["tasteProfile"] });

      setStep(3);
    } catch (error) {
      setStep(1);
      console.error("onboarding analysis failed", error);
      window.alert("취향 분석에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleRequestClose} />

      <div className="relative bg-white rounded-t-[20px] md:rounded-[20px] border border-light-gray-400 shadow-xl w-full max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col md:m-[15px]">
        <div className="flex items-start justify-between px-20pxr py-16pxr border-b border-light-gray-400">
          <div>
            <h2 className="text-18pxr font-bold text-black-100">
              {step === 1
                ? "좋아하는 웹소설 작품을 골라보세요."
                : step === 2
                  ? "취향 분석 중"
                  : "분석완료!"}
            </h2>
            {step === 1 && (
              <p className="mt-4pxr text-13pxr text-dark-gray-400 tracking-[-2%]">
                작품(최대 2개) 또는 태그를 선택해 주세요.
              </p>
            )}
          </div>
          <button
            className="p-4pxr disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRequestClose}
            disabled={step === 2 && isPending}
            aria-label="온보딩 모달 닫기"
          >
            <svg
              className="w-6 h-6 text-dark-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-20pxr py-16pxr">
          {step === 1 && (
            <>
              <p className="text-14pxr text-dark-gray-500 mb-16pxr tracking-[-2%]">
                선택: 작품 {selectedProducts.length}/2 · 태그 {totalSelectedTagCount}개
              </p>
              <div className="mb-16pxr">
                <div className="flex gap-6pxr overflow-x-auto scroll-hidden">
                  {tagTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`shrink-0 rounded-full border px-10pxr py-6pxr text-12pxr font-medium tracking-[-2%] ${
                        activeTagTab === tab.key
                          ? "border-primary-100 bg-primary-100 text-white"
                          : "border-light-gray-400 bg-white text-dark-gray-500"
                      }`}
                      onClick={() => setActiveTagTab(tab.key)}
                    >
                      {tab.label} ({tab.tags.length})
                    </button>
                  ))}
                </div>
                <div className="mt-8pxr min-h-[46px] rounded-[10px] border border-light-gray-400 bg-light-gray-100 p-8pxr">
                  {activeTags.length > 0 ? (
                    <div className="flex flex-wrap gap-6pxr">
                      {activeTags.map((item) => (
                        <button
                          key={`${activeTagTab}-${item.tag}`}
                          type="button"
                          className={`rounded-full border px-8pxr py-4pxr text-12pxr tracking-[-2%] ${
                            selectedTags[activeTagTab].includes(item.tag)
                              ? "border-primary-100 bg-primary-100 text-white"
                              : "border-light-gray-400 bg-white text-dark-gray-500"
                          }`}
                          onClick={() => toggleTag(activeTagTab, item.tag)}
                        >
                          #{item.tag}
                          {item.count > 0 ? ` · ${item.count}` : ""}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-12pxr text-dark-gray-400 tracking-[-2%]">
                      표시할 태그가 없어요.
                    </p>
                  )}
                </div>
              </div>
              {products.length === 0 ? (
                <div className="min-h-[280px] flex items-center justify-center rounded-[10px] border border-light-gray-400 bg-light-gray-100">
                  <p className="text-14pxr text-dark-gray-400 tracking-[-2%]">
                    지금은 선택 가능한 작품이 없어요.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-12pxr">
                  {products.map((product) => {
                    const isSelected = selectedProducts.includes(product.product_id);
                    const isCoverBroken = Boolean(
                      brokenCoverProductIds[product.product_id]
                    );
                    return (
                      <button
                        key={product.product_id}
                        className={`relative rounded-[10px] overflow-hidden border-2 transition-colors text-left ${
                          isSelected ? "border-primary-100" : "border-light-gray-400"
                        }`}
                        onClick={() => toggleProduct(product.product_id)}
                      >
                        <div className="w-full aspect-[2/3] bg-light-gray-100">
                          {product.cover_url && !isCoverBroken ? (
                            <Image
                              src={product.cover_url}
                              alt={product.title}
                              width={148}
                              height={215}
                              unoptimized
                              className="object-cover w-full h-full"
                              onError={() =>
                                setBrokenCoverProductIds((prev) => ({
                                  ...prev,
                                  [product.product_id]: true,
                                }))
                              }
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-11pxr text-dark-gray-300">
                              표지
                            </div>
                          )}
                        </div>
                        <div className="p-8pxr">
                          <p className="text-13pxr font-semibold text-black-100 line-clamp-2 tracking-[-2%]">
                            {product.title}
                          </p>
                          <p className="mt-2pxr text-12pxr text-dark-gray-400 line-clamp-1 tracking-[-2%]">
                            {product.author_name || "-"}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="absolute top-[6px] right-[6px] w-[22px] h-[22px] bg-primary-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center">
              <p className="text-15pxr font-medium text-dark-gray-700 text-center tracking-[-2%]">
                선택한 작품에 맞게 독자님의 취향을 분석합니다.
              </p>
              <div className="mt-20pxr w-10 h-10 border-2 border-light-gray-500 border-t-primary-100 rounded-full animate-spin" />
            </div>
          )}

          {step === 3 && (
            <div className="min-h-[280px] flex flex-col gap-14pxr">
              <p className="text-16pxr font-semibold text-black-100 tracking-[-2%]">
                {analysisType} 타입.
              </p>
              <p className="text-14pxr leading-[1.6] text-dark-gray-700 tracking-[-2%]">
                {analysisSummary}
              </p>
              <p className="text-14pxr leading-[1.6] text-dark-gray-700 tracking-[-2%]">
                분석결과를 토대로 AI 추천 구좌가 표시됩니다.
              </p>
              <p className="text-13pxr leading-[1.6] text-dark-gray-400 tracking-[-2%]">
                이 분석결과는 마이페이지에서도 다시 보거나, 재분석도 가능해요.
              </p>
            </div>
          )}
        </div>

        <div className="px-20pxr py-16pxr border-t border-light-gray-400">
          {step === 1 && (
            <div className="flex flex-col items-center gap-10pxr">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                disabled={
                  isPending ||
                  (selectedProducts.length === 0 && totalSelectedTagCount === 0)
                }
                onClick={handleSelect}
              >
                선택
              </Button>
              <button
                className="text-12pxr text-dark-gray-400 underline underline-offset-2"
                onClick={handleRequestClose}
              >
                나중에 고르기
              </button>
            </div>
          )}

          {step === 2 && (
            <Button variant="gray" size="md" className="w-full" disabled>
              분석 중...
            </Button>
          )}

          {step === 3 && (
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleRequestClose}
            >
              확인
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
