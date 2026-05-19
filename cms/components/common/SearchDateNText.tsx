import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactDatePicker from "react-datepicker";
import { item_per_page } from "@/constants/common";
import { isConfirmedEnter } from "@/lib/keyboard";
import { useSearchParams } from "next/navigation";

interface FilterControlsProps {
  options: { label: string; value: string }[];
  onSearch: (filters: any) => void;
  onReset?: () => void;
}

export function SearchDateNText({
  onSearch,
  onReset,
  options,
}: FilterControlsProps) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    search_target: "",
    search_word: "",
    start_date: undefined,
    end_date: undefined,
  });

  const handleChange = (name: string, value: any) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = useCallback(() => {
    onSearch({ ...filters, page: 1, count_per_page: item_per_page });
  }, [filters, onSearch]);

  const handleReset = useCallback(() => {
    const resetFilters = {
      search_target: "",
      search_word: "",
      start_date: undefined,
      end_date: undefined,
    };
    setFilters(resetFilters);
    onReset?.();
  }, [onReset]);

  useEffect(() => {
    const resetFilters = {
      search_target: "",
      search_word: "",
      start_date: undefined,
      end_date: undefined,
    };
    setFilters(resetFilters);
  }, [searchParams.toString()]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Select */}
      <Select
        value={filters.search_target}
        onValueChange={(val) => handleChange("search_target", val)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="검색 기준" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Input */}
      <Input
        placeholder="검색어 입력"
        value={filters.search_word}
        onChange={(e) => handleChange("search_word", e.target.value)}
        onKeyDown={(e) => {
          if (isConfirmedEnter(e)) handleSearch();
        }}
        className="w-[200px]"
      />

      {/* Date Range */}
      <ReactDatePicker
        selected={filters.start_date}
        onChange={(date) => handleChange("start_date", date ?? undefined)}
        dateFormat="yyyy-MM-dd"
        maxDate={filters.end_date}
        placeholderText="시작일"
        className="border px-3 py-2 rounded text-sm w-[140px]"
      />

      <ReactDatePicker
        selected={filters.end_date}
        onChange={(date) => handleChange("end_date", date ?? undefined)}
        dateFormat="yyyy-MM-dd"
        minDate={filters.start_date}
        placeholderText="종료일"
        className="border px-3 py-2 rounded text-sm w-[140px]"
      />

      {/* Buttons */}
      <Button variant="outline" type="button" onClick={handleReset}>
        초기화
      </Button>
      <Button type="button" onClick={handleSearch}>
        검색
      </Button>
    </div>
  );
}
