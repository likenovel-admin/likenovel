import { useMemo } from "react";

/**
 * 독자 여정 퍼널 (상세 유입 → 회차 진입 → 1화 완독).
 * 작품별분석 "유입/이탈" 탭 요약과 캡처 리포트가 공유하는 표현용 컴포넌트.
 * 데이터 패칭 없음 — 집계된 값만 받아 막대로 보여준다.
 * 색은 보수적으로: 막대는 primary-100, 누수 경고만 red-100.
 */

interface FunnelStage {
  label: string;
  value: number;
}

interface ReaderJourneyFunnelProps {
  detailInflow: number; // 상세페이지 유입
  episodeEntry: number; // 회차 진입
  firstEpisodeComplete?: number | null; // 1화 완독 (없으면 단계 생략)
  isSample?: boolean;
  embedded?: boolean;
  className?: string;
}

const formatNumber = (value: number) => value.toLocaleString("ko-KR");

const toPercent = (numerator: number, denominator: number) =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;

// 이 비율 이상으로 빠지는 단계 전환만 누수로 강조 (작은 자연 감소는 무시)
const LEAK_LOSS_THRESHOLD = 0.4;

const ReaderJourneyFunnel = ({
  detailInflow,
  episodeEntry,
  firstEpisodeComplete,
  isSample = false,
  embedded = false,
  className = "",
}: ReaderJourneyFunnelProps) => {
  const stages = useMemo<FunnelStage[]>(() => {
    const base: FunnelStage[] = [
      { label: "상세 유입", value: detailInflow },
      { label: "회차 진입", value: episodeEntry },
    ];
    if (typeof firstEpisodeComplete === "number") {
      base.push({ label: "1화 완독", value: firstEpisodeComplete });
    }
    return base;
  }, [detailInflow, episodeEntry, firstEpisodeComplete]);

  const maxValue = Math.max(1, ...stages.map((stage) => stage.value));

  // 단계 간 전환율 중 낙폭이 가장 큰 구간을 누수로 표시
  const worstDropIndex = useMemo(() => {
    let index = -1;
    let worstLossRate = LEAK_LOSS_THRESHOLD;
    for (let i = 1; i < stages.length; i += 1) {
      const prev = stages[i - 1].value;
      const lossRate = prev > 0 ? 1 - stages[i].value / prev : 0;
      if (lossRate > worstLossRate) {
        worstLossRate = lossRate;
        index = i;
      }
    }
    return index;
  }, [stages]);

  return (
    <div
      className={`${
        embedded
          ? ""
          : "border border-light-gray-300 rounded-[16px] bg-white p-16pxr md:p-20pxr"
      } ${className}`}
    >
      {embedded ? null : (
        <div className="flex items-center justify-between mb-14pxr">
          <span className="text-14pxr font-medium text-dark-gray-400">독자 여정</span>
          {isSample ? (
            <span className="text-11pxr text-deactivate-color">· 샘플 ·</span>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-12pxr">
        {stages.map((stage, index) => {
          const widthPercent = Math.max(6, (stage.value / maxValue) * 100);
          const prevStage = index > 0 ? stages[index - 1] : null;
          const conversion = prevStage ? toPercent(stage.value, prevStage.value) : null;
          const isLeak = index === worstDropIndex && conversion !== null;
          const lossCount = prevStage ? prevStage.value - stage.value : 0;

          return (
            <div key={stage.label} className="flex flex-col gap-6pxr">
              {conversion !== null ? (
                <div className="flex items-center gap-6pxr pl-2pxr">
                  <span className="text-12pxr text-dark-gray-300">↳ {conversion}%</span>
                  {isLeak ? (
                    <span className="text-12pxr font-medium text-red-100">
                      {`${formatNumber(lossCount)}명 이탈`}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="flex items-center gap-10pxr">
                <span className="w-[64px] shrink-0 text-13pxr text-dark-gray-500">
                  {stage.label}
                </span>
                <div className="relative flex-1 h-[18px] rounded-[6px] bg-light-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-[6px] ${
                      isLeak ? "bg-primary-200" : "bg-primary-100"
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <span className="w-[56px] shrink-0 text-right text-15pxr font-bold text-black-100">
                  {formatNumber(stage.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {detailInflow > 0 ? (
        <p className="mt-14pxr text-12pxr md:text-13pxr text-dark-gray-400">
          상세까지 {formatNumber(detailInflow)}명이 왔고, 그중 {formatNumber(episodeEntry)}명이 1화를
          열었어요 (회차 유입률 {toPercent(episodeEntry, detailInflow)}%).
        </p>
      ) : (
        <p className="mt-14pxr text-12pxr md:text-13pxr text-dark-gray-400">
          데이터가 없어 회차 유입률을 산출할 수 없습니다.
        </p>
      )}
    </div>
  );
};

export default ReaderJourneyFunnel;
