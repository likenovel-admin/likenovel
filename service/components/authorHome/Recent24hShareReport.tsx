import {
  AuthorRecent24hRankStatus,
  IAuthorProductRecent24hResponse,
} from "@/app/api/query/author/statistics/dto";
import { ReportHeader, ReportSection } from "./AuthorShareReport";

/**
 * 캡처/공유용 "작가 리포트" 카드 (최근 24시간 기준).
 * 24시간 요약 + 시간대 막대 + 어디서 읽혔나. 외부 이미지 없이 차트/텍스트만.
 */

const formatNumber = (value: number | null | undefined) =>
  typeof value === "number" ? value.toLocaleString("ko-KR") : "-";

const formatSigned = (value: number | null | undefined) => {
  if (typeof value !== "number") return "-";
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
};

const rankStatusLabel = (status: AuthorRecent24hRankStatus | undefined) => {
  switch (status) {
    case "reflected":
      return "반영 완료";
    case "pending":
      return "미반영";
    case "excluded":
      return "후보 제외";
    case "not_ready":
      return "준비 중";
    default:
      return status || "준비 중";
  }
};

interface Recent24hShareReportProps {
  productTitle: string;
  isSample: boolean;
  data?: IAuthorProductRecent24hResponse;
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[10px] bg-light-gray-100 px-12pxr py-10pxr">
    <div className="text-11pxr text-dark-gray-400">{label}</div>
    <div className="mt-4pxr text-16pxr font-bold text-black-100">{value}</div>
  </div>
);

const Recent24hShareReport = ({
  productTitle,
  isSample,
  data,
}: Recent24hShareReportProps) => {
  const summary = data?.summary;
  const recent = summary?.recent24hCountHit ?? null;
  const previous = summary?.previous24hCountHit ?? null;
  const diff =
    typeof recent === "number" && typeof previous === "number"
      ? recent - previous
      : null;

  const hourly = data?.hourly ?? [];
  const maxHourly = Math.max(1, ...hourly.map((row) => row.countHit));

  const episodes = data?.episodes ?? [];
  const sumBy = (predicate: (episodeNo: number) => boolean) =>
    episodes
      .filter((row) => predicate(row.episodeNo))
      .reduce((total, row) => total + row.recent24hCountHit, 0);
  const latestNos = new Set(
    [...episodes]
      .map((row) => row.episodeNo)
      .sort((a, b) => a - b)
      .slice(-5)
  );
  const segments = [
    { label: "초반부 1~10화", value: sumBy((no) => no <= 10) },
    { label: "중반부 11~100화", value: sumBy((no) => no >= 11 && no <= 100) },
    { label: "후반부 101화~", value: sumBy((no) => no >= 101) },
    { label: "최신 5화", value: episodes.length ? Array.from(latestNos).reduce(
        (total, no) => total + (episodes.find((e) => e.episodeNo === no)?.recent24hCountHit ?? 0),
        0
      ) : 0 },
  ];

  return (
    <div className="w-[360px] bg-white px-20pxr py-20pxr">
      <ReportHeader
        productTitle={productTitle}
        subLabel={isSample ? "최근 24시간 · 예시 데이터" : "최근 24시간"}
        isSample={isSample}
      />

      {isSample ? (
        <div className="mt-10pxr rounded-[8px] bg-light-gray-100 px-10pxr py-8pxr text-11pxr leading-16pxr text-dark-gray-400">
          화면 이해를 돕기 위한 예시 데이터입니다. 실제 수치가 아닙니다.
        </div>
      ) : null}

      <div className="mt-16pxr grid grid-cols-2 gap-8pxr">
        <Stat label="최근 24시간 조회" value={formatNumber(recent)} />
        <Stat label="전 24시간 대비" value={formatSigned(diff)} />
        <Stat label="누적 조회" value={formatNumber(summary?.cumulativeCountHit)} />
        <Stat label="Top50 반영" value={rankStatusLabel(summary?.rankStatus)} />
      </div>

      {hourly.length ? (
        <ReportSection title="시간대 흐름">
          <div className="flex items-end gap-2pxr h-[96px]">
            {hourly.map((row) => (
              <div
                key={row.hourLabel}
                className="flex-1 min-w-[3px] rounded-t-[2px] bg-dark-gray-700"
                style={{ height: `${Math.max(3, (row.countHit / maxHourly) * 88)}px` }}
              />
            ))}
          </div>
          <div className="flex gap-2pxr mt-6pxr">
            {hourly.map((row, idx) => (
              <span
                key={`h-${row.hourLabel}`}
                className="flex-1 min-w-[3px] text-center text-10pxr text-dark-gray-300 whitespace-nowrap"
              >
                {idx % 6 === 0 || idx === hourly.length - 1 ? row.hourLabel : ""}
              </span>
            ))}
          </div>
        </ReportSection>
      ) : null}

      {episodes.length ? (
        <ReportSection title="어디서 읽혔나">
          <div className="flex flex-col gap-6pxr text-13pxr text-black-100">
            {segments.map((seg) => (
              <div key={seg.label} className="flex justify-between">
                <span className="text-dark-gray-500">{seg.label}</span>
                <span className="font-bold">{formatNumber(seg.value)}</span>
              </div>
            ))}
          </div>
        </ReportSection>
      ) : null}
    </div>
  );
};

export default Recent24hShareReport;
