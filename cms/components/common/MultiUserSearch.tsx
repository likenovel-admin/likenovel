"use client";

import { IUser } from "@/types/user";
import apiClient from "@/lib/apiClient";
import { IGetUserResponse } from "@/api/user/dto";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";

const searchTargetOptions = [
  { value: "nickname", label: "닉네임" },
  { value: "email", label: "이메일" },
  { value: "user_id", label: "ID" },
];

interface PropsType {
  selectedUsers: IUser[];
  setSelectedUsers: React.Dispatch<React.SetStateAction<IUser[]>>;
}

export default function MultiUserSearch({
  selectedUsers,
  setSelectedUsers,
}: PropsType) {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const [searchTarget, setSearchTarget] = useState("nickname");
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout(timeoutId.current as NodeJS.Timeout);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    const newTimeoutId = setTimeout(async () => {
      try {
        const res = await apiClient.request<IGetUserResponse>({
          url: "/v1/query/admins/users",
          method: "GET",
          queryParams: {
            page: 1,
            count_per_page: 20,
            search_target: searchTarget,
            search_word: value.trim(),
          },
        });
        setSearchResults(res.results || []);
      } catch (err) {
        console.error("Error searching users:", err);
        setSearchResults([]);
      }
    }, 500);
    timeoutId.current = newTimeoutId;
  };

  const isSelected = (userId: number) =>
    selectedUsers.some((u) => u.user_id === userId);

  const handleSelect = (user: IUser) => {
    if (isSelected(user.user_id)) {
      setSelectedUsers((prev) =>
        prev.filter((u) => u.user_id !== user.user_id)
      );
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleRemove = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.user_id !== userId));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Select value={searchTarget} onValueChange={setSearchTarget}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {searchTargetOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[300px] justify-between"
            >
              <span className="truncate">
                {selectedUsers.length > 0
                  ? `${selectedUsers.length}명 선택됨`
                  : "유저를 검색하세요"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[400px] p-0 max-h-[300px] overflow-auto">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="검색어를 입력하세요..."
                value={search}
                onValueChange={(value) => handleSearch(value)}
              />
              <CommandEmpty>검색된 유저가 없습니다.</CommandEmpty>
              <CommandGroup>
                {searchResults.map((user) => (
                  <CommandItem
                    key={user.user_id}
                    value={String(user.user_id)}
                    onSelect={() => handleSelect(user)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected(user.user_id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span className="truncate">
                      [{user.user_id}] {user.nickname || user.name} ({user.email})
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedUsers.map((user) => (
            <span
              key={user.user_id}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
            >
              [{user.user_id}] {user.nickname || user.name}
              <button
                type="button"
                onClick={() => handleRemove(user.user_id)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
