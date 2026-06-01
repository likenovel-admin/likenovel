import { IAuthorProductEpisodeDropoffRow } from "@/app/api/query/author/statistics/dto";

/**
 * 회차별 독자 잔존/이탈 곡선.
 * 표②("회차별 읽다 나감")의 [그래프] 뷰. 표는 토글로 보존된다.
 * 막대 높이 = 그 회차를 펼친 독자 수(잔존), 이탈률 높은 회차는 red-100으로 강조(절벽).
 */

const HIGH_DROPOFF_THRESHOLD = 0.4;

const formatNumber = (value: number) => value.toLocaleString("ko-KR");

const formatPercent = (value: number | null | undefined) =>
  typeof value === "number" && !Number.isNaN(value)
    ? `${Math.round(value * 100)}%`
    : "-";

interface EpisodeDropoffCurveProps {
  rows: IAuthorProductEpisodeDropoffRow[];
  embedded?: boolean;
}

const EpisodeDropoffCurve = ({ rows, embedded = false }: EpisodeDropoffCurveProps) => {
  const sorted = [...rows].sort((a, b) => a.episode_no - b.episode_no);
  const maxRead = Math.max(1, ...sorted.map((row) => row.read_start_count));
  const meaningfulReads = maxRead * 0.1;
  // 가장 많이 멈춘(이탈률 최고) 회차 — 표본이 너무 작은 회차는 제외
  const worst = sorted
    .filter((row) => row.read_start_count >= meaningfulReads)
    .reduce<IAuthorProductEpisodeDropoffRow | null>((best, row) => {
      if (!best || row.episode_dropoff_rate > best.episode_dropoff_rate) {
        return row;
      }
      return best;
    }, null);
  const labelStep = Math.max(1, Math.round(sorted.length / 6));

  return (
    <div className={embedded ? "" : "px-16pxr md:px-20pxr py-16pxr"}>
      <div className="flex items-end gap-2pxr md:gap-3pxr h-[140px]">
        {sorted.map((row) => {
          const isHigh = row.episode_dropoff_rate >= HIGH_DROPOFF_THRESHOLD;
          return (
            <div
              key={row.episode_id}
              className={`flex-1 min-w-[3px] rounded-t-[2px] ${
                isHigh ? "bg-red-100" : "bg-dark-gray-700"
              }`}
              style={{
                height: `${Math.max(4, (row.read_start_count / maxRead) * 132)}px`,
              }}
              title={`${row.episode_no}화 · 진입 ${formatNumber(
                row.read_start_count
              )} · 이탈 ${formatPercent(row.episode_dropoff_rate)}`}
            />
          );
        })}
      </div>

      <div className="flex gap-2pxr md:gap-3pxr mt-6pxr">
        {sorted.map((row, idx) => (
          <span
            key={`ep-label-${row.episode_id}`}
            className="flex-1 min-w-[3px] text-center text-10pxr text-dark-gray-300 whitespace-nowrap"
          >
            {idx % labelStep === 0 ||
            idx === sorted.length - 1 ||
            row.episode_no === worst?.episode_no
              ? row.episode_no
              : ""}
          </span>
        ))}
      </div>

      {worst ? (
        <p className="mt-12pxr text-13pxr font-medium text-black-100">
          가장 많이 멈춘 회차는 {worst.episode_no}화
          {worst.episode_title ? ` '${worst.episode_title}'` : ""}예요 — 진입{" "}
          {formatNumber(worst.read_start_count)}명 중{" "}
          {formatPercent(worst.episode_dropoff_rate)}가 여기서 멈췄어요.
        </p>
      ) : null}
      <p className="mt-4pxr text-12pxr text-dark-gray-400">
        막대 높이는 그 회차를 펼친 독자 수(잔존)예요. 붉은 막대는 이탈이 큰 회차입니다.
      </p>
    </div>
  );
};

export default EpisodeDropoffCurve;
