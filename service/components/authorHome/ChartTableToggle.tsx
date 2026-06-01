/**
 * 그래프 ↔ 표 전환 토글. 유입경로/회차이탈 등 "그래프 기본 + 표 보존" 영역에서 공유.
 */

interface ChartTableToggleProps {
  value: "chart" | "table";
  onChange: (value: "chart" | "table") => void;
  chartLabel?: string;
}

const ChartTableToggle = ({
  value,
  onChange,
  chartLabel = "그래프",
}: ChartTableToggleProps) => {
  const buttonClass = (active: boolean) =>
    `h-[28px] px-10pxr text-12pxr font-medium ${
      active ? "bg-black-100 text-white" : "bg-white text-dark-gray-400"
    }`;

  return (
    <div className="flex rounded-[6px] border border-light-gray-300 overflow-hidden">
      <button
        type="button"
        onClick={() => onChange("chart")}
        className={buttonClass(value === "chart")}
      >
        {chartLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("table")}
        className={buttonClass(value === "table")}
      >
        표
      </button>
    </div>
  );
};

export default ChartTableToggle;
