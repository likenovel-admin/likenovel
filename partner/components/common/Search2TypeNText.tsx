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
import { item_per_page } from "@/constants/common";
import { useSearchParams } from "next/navigation";

interface FilterControlsProps {
  options1: { label: string; value: string }[];
  options2: { label: string; value: string }[];
  option2Placeholder?: string;
  onSearch: (filters: any) => void;
  onReset?: () => void;
}

export function Search2TypeNText({
  onSearch,
  onReset,
  options1,
  options2,
  option2Placeholder,
}: FilterControlsProps) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    search_target: "",
    type: "",
    search_word: "",
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
      type: "",
    };
    setFilters(resetFilters);
    onReset?.();
  }, [onReset]);

  useEffect(() => {
    const resetFilters = {
      search_target: "",
      search_word: "",
      status_code: "",
      type: "",
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
        value={filters.type}
        onValueChange={(val) => handleChange("type", val)}
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

      {/* Input */}
      <Input
        placeholder="검색어 입력"
        value={filters.search_word}
        onChange={(e) => handleChange("search_word", e.target.value)}
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
