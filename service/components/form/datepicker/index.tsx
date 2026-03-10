import { ko } from "date-fns/locale/ko";
import dayjs from "dayjs";
import Image from "next/image";
import { ReactNode, useState } from "react";
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
  disabled?: boolean;
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
  disabled,
  ...props
}: DatePickerProps) => {
  // Preserve outer references for CustomInput closure (inner params shadow these names)
  const dateValue = value;
  const handleDateChange = onChange;

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
            disabled={disabled}
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
                className={`mr-3 ${disabled ? "opacity-40" : "cursor-pointer"}`}
                onClick={disabled ? undefined : onClick}
              />
            }
          />
        </div>
        {showTimeSelect && (
          <div className="flex gap-1 items-center h-fit flex-1">
            <input
              type="time"
              value={dateValue ? dayjs(dateValue).format("HH:mm") : ""}
              onChange={(e) => {
                if (!e.target.value) return;
                const current = dateValue ? dayjs(dateValue) : dayjs();
                const [h, m] = e.target.value.split(":").map(Number);
                const merged = current.hour(h).minute(m).second(0).toDate();
                handleDateChange?.(merged);
              }}
              disabled={disabled}
              className="w-full p-2 border border-gray-300 rounded-lg text-14pxr text-dark-gray-400 font-normal disabled:opacity-40"
            />
          </div>
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
      shouldCloseOnSelect
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
      disabled={disabled}
      {...props}
    />
  );
};

export default DatePicker;
