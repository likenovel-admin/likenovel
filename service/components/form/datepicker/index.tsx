import { ko } from "date-fns/locale/ko";
import dayjs from "dayjs";
import Image from "next/image";
import { ReactNode, useEffect, useState } from "react";
import ReactDatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Input from "../input";
import "./datepicker.css";
registerLocale("ko", ko);

export interface DatePickerProps {
  label?: ReactNode;
  labelStyle?: string;
  inputStyle?: string;
  gap?: string;
  placeholder?: string;
  type?: string;
  isError?: boolean | null;
  name?: string;
  value?: Date;
  showTimeSelect?: boolean;
  showChangeYearOrMonth?: boolean;
  onChange?: (date: Date | null) => void;
}

const DatePicker = ({
  label,
  labelStyle,
  inputStyle,
  gap,
  isError,
  name,
  value,
  onChange,
  showTimeSelect,
  placeholder,
  showChangeYearOrMonth,
  ...props
}: DatePickerProps) => {
  const CustomInput = ({
    onBlur,
    onChange,
    onClick,
    onFocus,
    onKeyDown,
    value,
  }: any) => {
    return (
      <div className="flex gap-2 items-end">
        <div className={"flex flex-[2] w-full"}>
          <Input
            ref={null}
            onBlur={onBlur}
            onChange={onChange}
            onClick={onClick}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            value={value ? dayjs(value).format("YYYY-MM-DD") : ""}
            label={label}
            labelStyle={labelStyle}
            inputStyle={inputStyle}
            readOnly
            gap={gap}
            full
            isError={isError}
            name={name}
            placeholder={placeholder}
            additionalText={
              <Image
                src="/images/calendar.svg"
                alt="calendar"
                width={20}
                height={20}
                className="mr-3 cursor-pointer"
                onClick={onClick}
              />
            }
          />
        </div>
        {showTimeSelect && (
          <>
            <div className="flex gap-1 items-center h-fit flex-1">
              <Input
                onBlur={onBlur}
                onChange={onChange}
                onClick={onClick}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                value={value ? dayjs(value).format("HH") : ""}
                inputStyle={inputStyle}
                readOnly
              />
              시
            </div>
            <div className="flex gap-1 items-center h-fit flex-1">
              <Input
                onBlur={onBlur}
                onChange={onChange}
                onClick={onClick}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                inputStyle={inputStyle}
                value={value ? dayjs(value).format("mm") : ""}
                readOnly
              />
              분
            </div>
          </>
        )}
      </div>
    );
  };

  // ✅ 기본 뷰 타입을 "month" 로 설정 (좌/우 클릭 시 월 단위 이동)
  const [viewType, setViewType] = useState<"year" | "month">("month");

  const handleChangeViewType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewType(e.target.value as "year" | "month");
  };

  // ✅ 예약 설정 기본 날짜 = 오늘 날짜 (showTimeSelect 있을 때만 default 사용)
  const initialDate = dayjs().toDate();

  return (
    <ReactDatePicker
      // @ts-ignore
      // ✅ FIX: showTimeSelect이 true면 기본값을 오늘 날짜로 설정
      selected={value || (showTimeSelect ? initialDate : null)}
      onChange={(date) => {
        onChange?.(date);
      }}
      dateFormat={"yyyy-MM-dd HH:mm"}
      popperPlacement="bottom-start"
      customInput={<CustomInput />}
      locale={"ko"}
      showPopperArrow={false}
      showTimeInput={showTimeSelect}
      shouldCloseOnSelect={!showTimeSelect}
      //@ts-ignore
      customTimeInput={<CustomTimeInput />}
      renderCustomHeader={({
        date,
        decreaseMonth,
        increaseMonth,
        decreaseYear,
        increaseYear,
      }: any) => (
        <div className="flex items-center justify-between px-2 pt-1 pb-3">
          {showChangeYearOrMonth && (
            <select value={viewType} onChange={handleChangeViewType}>
              {/* 필요 없다면 "연도" 옵션은 제거해도 됩니다 */}
              <option value="year">연도</option>
              <option value="month">월</option>
            </select>
          )}
          <button
            type="button"
            onClick={() => {
              if (viewType === "year") {
                decreaseYear();
              } else {
                decreaseMonth();
              }
            }}
            className="text-gray-400 border border-gray-300 w-[30px] h-[30px] flex relative justify-center items-center rounded-full focus:outline-none"
          >
            <Image
              src="/images/arrow-left-small.svg"
              alt="arrow-left"
              width={5.5}
              height={9}
            />
          </button>
          <span className="text-dark-gray-700 font-bold text-18pxr">
            {dayjs(date).format("YYYY.MM")}
          </span>
          <button
            type="button"
            onClick={() => {
              if (viewType === "year") {
                increaseYear();
              } else {
                increaseMonth();
              }
            }}
            className="text-gray-400 border border-gray-300 w-[30px] h-[30px] flex justify-center items-center rounded-full focus:outline-none"
          >
            <Image
              src="/images/arrow-right-small.svg"
              alt="arrow-right"
              width={5.5}
              height={9}
            />
          </button>
        </div>
      )}
      {...props}
    />
  );
};

const CustomTimeInput = ({
  date,
  onChange,
}: {
  date: Date;
  onChange: (time: string) => void;
}) => {
  const day = dayjs(date);

  // 현재 24시간제 시/분
  const hour24 = day.hour();
  const minute = day.minute();

  // 12시간제 표시용
  const defaultHour = day.format("hh"); // 01 ~ 12
  const defaultMinute = day.format("mm");

  // ✅ "오전" / "오후" 를 현재 시각 기준으로 계산 (초기값만)
  const [selectedPeriod, setSelectedPeriod] = useState(
    hour24 >= 12 ? "오후" : "오전"
  );

  // ✅ FIX: date가 외부에서 완전히 새로운 날짜로 변경되었을 때만 동기화
  // (시/분/오전오후 변경에는 반응하지 않음)
  const [prevDate, setPrevDate] = useState<string>(day.format("YYYY-MM-DD"));

  useEffect(() => {
    const currentDate = day.format("YYYY-MM-DD");
    // 날짜(년월일)가 바뀌었을 때만 period 재설정
    if (currentDate !== prevDate) {
      setSelectedPeriod(hour24 >= 12 ? "오후" : "오전");
      setPrevDate(currentDate);
    }
  }, [day.format("YYYY-MM-DD"), hour24, prevDate]);

  const hours = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const minutes = ["00", "10", "20", "30", "40", "50"];
  const periods = ["오전", "오후"];

  const handleTimeChange = (
    value: string,
    type: "hour" | "minute" | "period"
  ) => {
    const currentHour12 = day.format("hh"); // 12시간제 기준 현재 시
    const currentMinute = day.format("mm");

    const hour12 = type === "hour" ? value : currentHour12;
    const minuteStr = type === "minute" ? value : currentMinute;
    const period = type === "period" ? value : selectedPeriod;

    let h = parseInt(hour12, 10);

    // ✅ FIX: 12시간제 → 24시간제 변환 (오전/오후 맞게)
    if (period === "오후") {
      // 오후 12시(정오)는 12시 그대로
      if (h === 12) {
        h = 12;
      } else {
        // 오후 1~11시는 +12 (13~23시)
        h = h + 12;
      }
    } else {
      // 오전
      if (h === 12) {
        // 오전 12시(자정)는 0시
        h = 0;
      }
      // 오전 1~11시는 그대로 (1~11시)
    }

    const hStr = String(h).padStart(2, "0");
    const timeStr = `${hStr}:${minuteStr}`;

    // ✅ FIX: period 상태 업데이트 (오전/오후 변경 시)
    if (type === "period") {
      setSelectedPeriod(period);
    }

    // react-datepicker 에서 요구하는 포맷: "HH:mm"
    onChange(timeStr);
  };

  return (
    <>
      <select
        value={defaultHour}
        onChange={(e) => handleTimeChange(e.target.value, "hour")}
        className="p-2 border border-gray-300 rounded-lg flex-1 text-14pxr text-dark-gray-400 font-normal"
      >
        {hours.map((h) => (
          <option key={h} value={h}>
            {h}시
          </option>
        ))}
      </select>
      <select
        value={defaultMinute}
        onChange={(e) => handleTimeChange(e.target.value, "minute")}
        className="p-2 border border-gray-300 rounded-lg flex-1 text-14pxr text-dark-gray-400 font-normal"
      >
        {minutes.map((m) => (
          <option key={m} value={m}>
            {m}분
          </option>
        ))}
      </select>
      <select
        value={selectedPeriod}
        onChange={(e) => handleTimeChange(e.target.value, "period")}
        className="p-2 border border-gray-300 rounded-lg flex-1 text-14pxr text-dark-gray-400 font-normal"
      >
        {periods.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </>
  );
};

export default DatePicker;
