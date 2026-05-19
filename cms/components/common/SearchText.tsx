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
import { isConfirmedEnter } from "@/lib/keyboard";
import { useSearchParams } from "next/navigation";

interface FilterControlsProps {
  options: { label: string; value: string }[];
  onSearch: (filters: any) => void;
  onReset?: () => void;
}

export function SearchText({
  onSearch,
  onReset,
  options,
}: FilterControlsProps) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    search_target: options[0]?.value ?? "",
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
      search_target: options[0]?.value ?? "",
      search_word: "",
    };
    setFilters(resetFilters);
    onReset?.();
  }, [onReset, options]);

  useEffect(() => {
    setFilters({
      search_target: options[0]?.value ?? "",
      search_word: "",
    });
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
