import { useEffect, useState } from "react";
import type { Ref } from "react";
import CircleWarn from "/public/images/circle-warn.svg";

interface Props {
  value: Date | null;
  onChange: (date: Date) => void;
  isError: boolean;
  errorText: string;
  focusRef?: Ref<HTMLSelectElement>;
}

const BirthdateSelector = ({
  value,
  onChange,
  isError = false,
  errorText,
  focusRef,
}: Props) => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 100; // 예: 100년 전부터 현재까지

  const [selectedYear, setSelectedYear] = useState(
    value ? value.getFullYear() : ""
  );
  const [selectedMonth, setSelectedMonth] = useState(
    value ? value.getMonth() + 1 : ""
  );
  const [selectedDay, setSelectedDay] = useState(value ? value.getDate() : "");
  const selectBorderStyle = isError
    ? "border-[2px] border-red-100 bg-[#FFF4F4] focus:border-red-100 focus:outline-none"
    : "border border-light-gray-500";

  useEffect(() => {
    if (selectedYear && selectedMonth && selectedDay) {
      const date = new Date(
        Number(selectedYear),
        Number(selectedMonth) - 1,
        Number(selectedDay)
      );
      onChange(date);
    }
  }, [selectedYear, selectedMonth, selectedDay, onChange]);

  const generateYearOptions = () => {
    const years = [];
    for (let year = currentYear; year >= startYear; year--) {
      years.push(
        <option key={year} value={year}>
          {year}년
        </option>
      );
    }
    return years;
  };

  return (
    <div className="flex w-full gap-2">
      <div className="flex w-full flex-col">
        <label className="text-sm font-semibold mb-1">생년월일</label>
        <div className="flex w-full gap-2">
          <select
            ref={focusRef}
            className={`rounded-md p-2 text-gray-700 w-[160px] h-[44px] overflow-y-auto ${selectBorderStyle}`}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            aria-invalid={isError}
          >
            <option value="">년</option>
            {generateYearOptions()}
          </select>
          <select
            className={`rounded-md p-2 text-gray-700 w-[120px] ${selectBorderStyle}`}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            aria-invalid={isError}
          >
            <option value="">월</option>
            {[...Array(12)].map((_, index) => (
              <option key={index} value={index + 1}>
                {String(index + 1).padStart(2, "0")}월
              </option>
            ))}
          </select>
          <select
            className={`rounded-md p-2 text-gray-700 w-[120px] ${selectBorderStyle}`}
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            aria-invalid={isError}
          >
            <option value="">일</option>
            {[...Array(31)].map((_, index) => (
              <option key={index} value={index + 1}>
                {String(index + 1).padStart(2, "0")}일
              </option>
            ))}
          </select>
        </div>
        <>
          {isError && (
            <span
              className={
                "flex items-center mt-[8px] text-12pxr text-red-100 gap-3pxr"
              }
            >
              <CircleWarn className="w-[13px] h-[13px]" />
              {errorText}
            </span>
          )}
        </>
      </div>
    </div>
  );
};

export default BirthdateSelector;
