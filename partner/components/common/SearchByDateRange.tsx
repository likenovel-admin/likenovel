"use client";
import { Input } from "@/components/ui/input";
import { useCallback } from "react";
import ReactDatePicker from "react-datepicker";

interface Props {
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (val: Date | null) => void;
  setEndDate: (val: Date | null) => void;
}

export default function SearchByDateRange({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: Props) {
  const handleStartDateChange = useCallback((selectedDate: Date | null) => {
    setStartDate(selectedDate);
  }, []);
  const handleEndDateChange = useCallback((selectedDate: Date | null) => {
    setEndDate(selectedDate);
  }, []);
  return (
    <div className="flex items-center gap-2">
      <ReactDatePicker
        selected={startDate || null}
        onChange={handleStartDateChange}
        dateFormat="yyyy-MM-dd"
        maxDate={endDate ? endDate : undefined}
        customInput={<Input />}
        enableTabLoop={false}
        placeholderText="시작일을 입력해주세요."
      />
      ~
      <ReactDatePicker
        selected={endDate || null}
        onChange={handleEndDateChange}
        dateFormat="yyyy-MM-dd"
        minDate={startDate ? startDate : undefined}
        customInput={<Input />}
        enableTabLoop={false}
        placeholderText="종료일을 입력해주세요."
      />
    </div>
  );
}
