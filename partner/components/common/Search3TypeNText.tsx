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
import { useSearchParams } from "next/navigation";
import { isPositiveIntegerInput, showAlert } from "@/lib/utils";

interface FilterControlsProps {
  options1: { label: string; value: string }[];
  options2: { label: string; value: string }[];
  options3: { label: string; value: string }[];
  option2Placeholder?: string;
  option3Placeholder?: string;
  onSearch: (filters: any) => void;
  onReset?: () => void;
}

export function Search3TypeNText({
  onSearch,
  onReset,
  options1,
  options2,
  options3,
  option2Placeholder,
  option3Placeholder,
}: FilterControlsProps) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    search_target: "",
    status_code: "",
    contract_type: "",
    search_word: "",
  });

  const handleChange = (name: string, value: any) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = useCallback(() => {
    if (
      filters.search_target.includes("id") &&
      (!isPositiveIntegerInput(filters.search_word) ||
        filters.search_word === "")
    ) {
      showAlert(
        "알림",
        "검색 조건이 아이디인 경우, 검색어는 숫자여야 합니다.",
        "확인"
      );
      return;
    }
    onSearch({ ...filters, page: 1, count_per_page: item_per_page });
  }, [filters, onSearch]);

  const handleReset = useCallback(() => {
    const resetFilters = {
      search_target: "",
      search_word: "",
      status_code: "",
      contract_type: "",
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
      status_code: "",
      contract_type: "",
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
            {options1.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={filters.contract_type}
        onValueChange={(val) => handleChange("contract_type", val)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={option2Placeholder || "검색 기준"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options2.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        value={filters.status_code}
        onValueChange={(val) => handleChange("status_code", val)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={option3Placeholder || "검색 기준"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options3.map((option) => (
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
        // onChange={(e) => {
        //   const value = e.target.value;
        //   console.log(
        //     (isPositiveIntegerInput(value) || value === "") &&
        //       filters.search_target.includes("id"),
        //     isPositiveIntegerInput(value) || value === "",
        //     filters.search_target.includes("id")
        //   );
        //   if (filters.search_target.includes("id")) {
        //     (isPositiveIntegerInput(value) || value === "") &&
        //       handleChange(
        //         "search_word",
        //         value === "" ? "" : Number(value) + ""
        //       );
        //   } else {
        //     handleChange("search_word", value);
        //   }
        // }}
        className="w-[200px]"
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
