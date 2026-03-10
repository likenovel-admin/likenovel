"use client";

import { useGetTasteProfile } from "@/app/api/query/recommendation";
import Button from "@/components/common/Button";
import { useState } from "react";
import OnboardingModal from "./OnboardingModal";

const AXIS_ITEMS = [
  { key: "worldview", defaultLabel: "세계관" },
  { key: "job", defaultLabel: "주인공 직업" },
  { key: "material", defaultLabel: "능력/소재" },
  { key: "romance", defaultLabel: "관계/로맨스" },
  { key: "style", defaultLabel: "작풍" },
  { key: "type", defaultLabel: "주인공 유형" },
  { key: "goal", defaultLabel: "주인공 목표" },
] as const;
type AxisKey = (typeof AXIS_ITEMS)[number]["key"];

const toAxisTagMap = (axisTags?: Record<string, string[] | undefined>) => {
  const result: Record<AxisKey, string[]> = {
    worldview: [],
    job: [],
    material: [],
    romance: [],
    style: [],
    type: [],
    goal: [],
  };
  AXIS_ITEMS.forEach(({ key }) => {
    const tags = axisTags?.[key];
    result[key] = Array.isArray(tags)
      ? tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 3)
      : [];
  });
  return result;
};

const buildFallbackTop3 = (tags: string[]) => {
  const basis = [50, 30, 20];
  return tags.slice(0, 3).map((tag, index) => ({
    label: tag,
    percent: basis[index] ?? 0,
  }));
};

const TasteDashboard = () => {
  const { data: profileData } = useGetTasteProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const profile = profileData?.data;
  const axisTagMap = toAxisTagMap(profile?.axis_tags);

  const renderAxisList = () => (
    <div className="mb-14pxr">
      <h4 className="text-13pxr font-semibold text-dark-gray-500 mb-8pxr">
        7축 취향 분석
      </h4>
      <div className="flex flex-col gap-10pxr">
        {AXIS_ITEMS.map((axis) => {
          const serverTop3 = profile?.axis_top3?.[axis.key];
          const entries = Array.isArray(serverTop3) && serverTop3.length > 0
            ? serverTop3.slice(0, 3).map((entry) => ({
                label: String(entry?.label || "").trim(),
                percent: Number(entry?.percent || 0),
              })).filter((entry) => entry.label)
            : buildFallbackTop3(axisTagMap[axis.key] ?? []);
          const axisLabel = profile?.axis_labels?.[axis.key] || axis.defaultLabel;
          const insight = profile?.axis_insights?.[axis.key] || "";
          const maxPercent = entries.reduce((max, entry) => Math.max(max, entry.percent), -1);
          const maxIndex = entries.findIndex((entry) => entry.percent === maxPercent);
          return (
            <div
              key={axis.key}
              className="rounded-[10px] border border-light-gray-400 bg-white p-12pxr"
            >
              <div className="flex items-center">
                <p className="text-13pxr font-semibold text-dark-gray-700 tracking-[-2%]">
                  {axisLabel}
                </p>
              </div>

              {insight && (
                <p className="mt-6pxr text-12pxr text-dark-gray-500 tracking-[-2%]">
                  {insight}
                </p>
              )}

              <div className="mt-8pxr min-h-[70px] space-y-8pxr">
                {entries.length === 0 ? (
                  <p className="pt-4pxr text-12pxr text-dark-gray-400 tracking-[-2%]">
                    현재 수집중입니다. 다양한 작품을 읽어보세요.
                  </p>
                ) : (
                  entries.map((entry, index) => {
                    const percent = Math.max(0, Math.min(100, Math.round(entry.percent)));
                    const isTopEntry = index === maxIndex;
                    return (
                      <div key={`${axis.key}-${entry.label}`}>
                        <div className="flex items-center justify-between text-12pxr tracking-[-2%]">
                          <span className="text-dark-gray-700">#{entry.label}</span>
                          <span className="text-dark-gray-500">{percent}%</span>
                        </div>
                        <div className="mt-4pxr h-8pxr rounded-full bg-light-gray-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isTopEntry ? "bg-primary-100" : "bg-dark-gray-300"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!profile?.has_profile) {
    return (
      <div className="bg-light-gray-50 rounded-[10px] p-20pxr">
        <h3 className="text-16pxr font-bold mb-6pxr">현재 취향</h3>
        <p className="text-13pxr text-dark-gray-400 mb-6pxr">
          아직 수집된 취향 데이터가 없어요.
        </p>
        <p className="text-12pxr text-dark-gray-400 mb-14pxr">
          7일 단위로 갱신됩니다.
        </p>
        {renderAxisList()}
        <Button
          variant="primary"
          size="md"
          className="w-full"
          onClick={() => setShowOnboarding(true)}
        >
          취향 설정하기
        </Button>
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-light-gray-50 rounded-[10px] p-20pxr">
      <div className="flex items-center justify-between mb-14pxr">
        <div>
          <h3 className="text-16pxr font-bold">현재 취향</h3>
          <p className="mt-2pxr text-12pxr text-dark-gray-400">
            7일 단위로 갱신됩니다.
          </p>
        </div>
        <Button
          variant="blueBorder"
          size="sm"
          onClick={() => setShowOnboarding(true)}
        >
          다시 설정
        </Button>
      </div>

      {/* 취향 요약 */}
      {profile.taste_summary && (
        <div className="bg-white rounded-[10px] p-14pxr mb-14pxr border border-light-gray-400">
          <p className="text-14pxr text-dark-gray-700 leading-[1.6]">
            &ldquo;{profile.taste_summary}&rdquo;
          </p>
        </div>
      )}

      {renderAxisList()}

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  );
};

export default TasteDashboard;
