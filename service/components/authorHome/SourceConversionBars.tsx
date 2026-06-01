import { IAuthorProductInflowDropoffSourceGroup } from "@/app/api/query/author/statistics/dto";

/**
 * 유입 경로별 회차 전환율 가로 막대.
 * 표①("상세페이지 유입과 회차 진입")의 [그래프] 뷰. 표는 그대로 토글로 보존된다.
 * 막대 길이 = 회차 유입률, 전환 낮은 경로는 red-100으로 강조.
 */

const LOW_CONVERSION_THRESHOLD = 0.35;

const formatNumber = (value: number) => value.toLocaleString("ko-KR");

const formatPercent = (value: number | null | undefined) =>
  typeof value === "number" && !Number.isNaN(value)
    ? `${(value * 100).toFixed(1)}%`
    : "-";

interface SourceConversionBarsProps {
  rows: IAuthorProductInflowDropoffSourceGroup[];
  getLabel: (row: IAuthorProductInflowDropoffSourceGroup) => string;
  embedded?: boolean;
}

const SourceConversionBars = ({
  rows,
  getLabel,
  embedded = false,
}: SourceConversionBarsProps) => {
  return (
    <div
      className={`flex flex-col gap-10pxr ${
        embedded ? "" : "px-16pxr md:px-20pxr py-16pxr"
      }`}
    >
      {rows.map((row) => {
        const hasConversion =
          typeof row.read_conversion_rate === "number" &&
          !Number.isNaN(row.read_conversion_rate);
        const conversion = hasConversion ? row.read_conversion_rate ?? 0 : 0;
        const widthPercent = hasConversion
          ? Math.max(2, Math.min(100, conversion * 100))
          : 2;
        const isLow = hasConversion && conversion < LOW_CONVERSION_THRESHOLD;

        return (
          <div
            key={row.entry_source_group}
            className="flex items-center gap-8pxr md:gap-10pxr"
          >
            <span className="w-[60px] md:w-[72px] shrink-0 text-13pxr text-dark-gray-500">
              {getLabel(row)}
            </span>
            <div className="relative flex-1 h-[18px] rounded-[6px] bg-light-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-[6px] ${
                  hasConversion
                    ? isLow
                      ? "bg-red-100"
                      : "bg-primary-100"
                    : "bg-light-gray-300"
                }`}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
            <span className="w-[50px] shrink-0 text-right text-13pxr font-bold text-black-100">
              {hasConversion ? formatPercent(conversion) : "-"}
            </span>
            <span className="w-[80px] shrink-0 text-right text-12pxr text-dark-gray-300">
              유입 {formatNumber(row.detail_session_count)}
            </span>
          </div>
        );
      })}
      <p className="mt-4pxr text-12pxr text-dark-gray-400">
        막대는 상세페이지 유입 대비 회차로 넘어간 비율(회차 유입률)이에요. 붉은 막대는 전환이 낮은 경로입니다.
      </p>
    </div>
  );
};

export default SourceConversionBars;
