"use client";

import {
  usePostOnboarding,
  usePostOnboardingDismiss,
} from "@/app/api/query/recommendation";
import Button from "@/components/common/Button";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  dismissOnClose?: boolean;
}

type OnboardingTagTab = "hero" | "world" | "relation" | "style";
type SelectedTagState = Record<OnboardingTagTab, string[]>;

type OnboardingTagConfig = {
  key: OnboardingTagTab;
  label: string;
  tags: string[];
};

const ONBOARDING_TAG_TABS: OnboardingTagConfig[] = [
  {
    key: "hero",
    label: "주인공",
    tags: [
      "성장형",
      "먼치킨",
      "망나니",
      "귀환자",
      "헌터",
      "천재",
      "고인물",
      "랭커",
      "엑스트라",
      "전략",
    ],
  },
  {
    key: "world",
    label: "세계관",
    tags: [
      "현대",
      "아카데미",
      "중세",
      "게임",
      "게이트",
      "던전",
      "아포칼립스",
      "탑",
      "대체역사",
      "디스토피아",
    ],
  },
  {
    key: "relation",
    label: "관계",
    tags: [
      "집착",
      "순애",
      "러브코미디",
      "소꿉친구",
      "츤데레",
      "하렘",
      "악녀",
      "조력자",
      "성녀",
      "메이드",
    ],
  },
  {
    key: "style",
    label: "작풍",
    tags: [
      "착각",
      "코미디",
      "유쾌",
      "통쾌",
      "피폐",
      "힐링",
      "모험",
      "전쟁",
      "느와르",
      "밀리터리",
    ],
  },
];

const EMPTY_SELECTED_TAGS: SelectedTagState = {
  hero: [],
  world: [],
  relation: [],
  style: [],
};

const MIN_SELECTED_TAGS = 2;
const MAX_SELECTED_TAGS = 6;

const OnboardingModal = ({
  isOpen,
  onClose,
  dismissOnClose = false,
}: Props) => {
  const [activeTagTab, setActiveTagTab] = useState<OnboardingTagTab>("hero");
  const [selectedTags, setSelectedTags] = useState<SelectedTagState>(
    EMPTY_SELECTED_TAGS
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { mutateAsync: postOnboarding, isPending } = usePostOnboarding();
  const { mutateAsync: dismissOnboarding } = usePostOnboardingDismiss();
  const queryClient = useQueryClient();

  const activeTags = useMemo(
    () => ONBOARDING_TAG_TABS.find((tab) => tab.key === activeTagTab)?.tags ?? [],
    [activeTagTab]
  );

  const selectedTagItems = useMemo(
    () =>
      ONBOARDING_TAG_TABS.flatMap((tab) =>
        selectedTags[tab.key].map((tag) => ({
          key: `${tab.key}:${tag}`,
          tabKey: tab.key,
          label: tag,
        }))
      ),
    [selectedTags]
  );

  const totalSelectedTagCount = selectedTagItems.length;
  const canSubmit = totalSelectedTagCount >= MIN_SELECTED_TAGS;
  const hasReachedSelectionLimit = totalSelectedTagCount >= MAX_SELECTED_TAGS;

  useEffect(() => {
    if (!isOpen) {
      setActiveTagTab("hero");
      setSelectedTags(EMPTY_SELECTED_TAGS);
      setHasSubmitted(false);
    }
  }, [isOpen]);

  const toggleTag = useCallback(
    (tab: OnboardingTagTab, tag: string) => {
      setSelectedTags((prev) => {
        const next = new Set(prev[tab]);

        if (next.has(tag)) {
          next.delete(tag);
        } else {
          const currentCount =
            prev.hero.length +
            prev.world.length +
            prev.relation.length +
            prev.style.length;

          if (currentCount >= MAX_SELECTED_TAGS) {
            return prev;
          }

          next.add(tag);
        }

        return {
          ...prev,
          [tab]: Array.from(next),
        };
      });
    },
    []
  );

  const handleRequestClose = useCallback(async () => {
    if (isPending) return;

    if (dismissOnClose && !hasSubmitted) {
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
  }, [dismissOnClose, dismissOnboarding, hasSubmitted, isPending, onClose, queryClient]);

  const handleSubmit = async () => {
    if (!canSubmit || isPending) {
      return;
    }

    try {
      await postOnboarding({
        product_ids: [],
        moods: [],
        hero_tags: selectedTags.hero,
        world_tone_tags: [...selectedTags.world, ...selectedTags.style],
        relation_tags: selectedTags.relation,
      });

      queryClient.invalidateQueries({
        queryKey: ["tasteRecommendations"],
      });
      queryClient.invalidateQueries({ queryKey: ["tasteProfile"] });

      setHasSubmitted(true);
      onClose();
    } catch (error) {
      console.error("onboarding analysis failed", error);
      window.alert("취향 설정에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleRequestClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[20px] border border-light-gray-400 bg-white shadow-xl md:m-[15px] md:rounded-[20px]">
        <div className="flex items-start justify-between border-b border-light-gray-400 px-20pxr py-16pxr">
          <div>
            <h2 className="text-18pxr font-bold tracking-[-2%] text-black-100">
              취향에 맞는 작품을 바로 보여드릴게요
            </h2>
            <p className="mt-4pxr text-13pxr tracking-[-2%] text-dark-gray-400">
              마음에 드는 태그를 2~6개 골라주세요.
            </p>
            <p className="mt-4pxr text-12pxr leading-[1.5] tracking-[-2%] text-dark-gray-400">
              선택한 취향은 추천에 먼저 반영되고, 취향 분석은 최근 읽기 행동을 바탕으로 7일 단위로 갱신됩니다.
            </p>
          </div>
          <button
            className="p-4pxr disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleRequestClose}
            disabled={isPending}
            aria-label="온보딩 모달 닫기"
          >
            <svg
              className="h-6 w-6 text-dark-gray-400"
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
          <div className="mx-[-20pxr] mb-14pxr px-20pxr">
            <div className="flex w-full">
              {ONBOARDING_TAG_TABS.map((tab) => {
                const isActive = activeTagTab === tab.key;
                const hasSelections = selectedTags[tab.key].length > 0;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    className={`relative flex h-[46px] flex-1 items-center justify-center border border-t-0 border-l-0 border-r-0 text-13pxr font-medium tracking-[-2%] transition-colors ${
                      isActive
                        ? "border-b-[2px] border-b-black-100 text-black-100"
                        : "border-b-[1px] border-b-light-gray-300 text-dark-gray-400"
                    }`}
                    onClick={() => setActiveTagTab(tab.key)}
                  >
                    <span>{tab.label}</span>
                    {hasSelections && (
                      <span
                        className={`ml-6pxr inline-block h-[6px] w-[6px] rounded-full ${
                          isActive ? "bg-black-100" : "bg-primary-100"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTagItems.length > 0 && (
            <div className="mb-16pxr rounded-[10px] border border-light-gray-400 bg-light-gray-100 p-10pxr">
              <div className="flex flex-wrap gap-8pxr">
                {selectedTagItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleTag(item.tabKey, item.label)}
                    className="inline-flex items-center gap-6pxr rounded-full border border-primary-100 bg-white px-10pxr py-6pxr text-12pxr font-medium tracking-[-2%] text-primary-100"
                  >
                    <span>{item.label}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12pxr rounded-[10px] border border-light-gray-400 bg-white p-10pxr">
            <div className="flex flex-wrap gap-8pxr">
              {activeTags.map((tag) => {
                const isSelected = selectedTags[activeTagTab].includes(tag);
                const isDisabled = !isSelected && hasReachedSelectionLimit;

                return (
                  <button
                    key={`${activeTagTab}-${tag}`}
                    type="button"
                    onClick={() => toggleTag(activeTagTab, tag)}
                    disabled={isDisabled}
                    className={`rounded-full border px-12pxr py-8pxr text-13pxr font-medium tracking-[-2%] transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                      isSelected
                        ? "border-primary-100 bg-primary-100 text-white"
                        : "border-light-gray-400 bg-white text-dark-gray-500"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-light-gray-400 px-20pxr py-16pxr">
          <div className="mb-10pxr min-h-[20px] text-12pxr tracking-[-2%] text-dark-gray-400">
            {!canSubmit
              ? "최소 2개 선택해주세요."
              : hasReachedSelectionLimit
                ? "최대 6개까지 선택할 수 있어요."
                : ""}
          </div>
          <div className="flex flex-col items-center gap-10pxr">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              disabled={!canSubmit || isPending}
              onClick={handleSubmit}
            >
              {isPending ? "적용 중..." : "이 취향으로 추천받기"}
            </Button>
            <button
              className="text-12pxr tracking-[-2%] text-dark-gray-400 underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleRequestClose}
              disabled={isPending}
            >
              나중에 할게요
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
