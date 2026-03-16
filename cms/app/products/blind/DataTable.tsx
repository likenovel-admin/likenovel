"use client";

import { IBlindProduct } from "@/api/blind/dto";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { format } from "date-fns";

interface Props {
  data: IBlindProduct[];
  loading?: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onToggleBlind: (productId: number, blindYn: string) => void;
}

export default function BlindDataTable({
  data,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onToggleBlind,
}: Props) {
  if (loading) {
    return (
      <div className="px-4 py-2 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="px-4 py-2 text-center text-sm text-muted-foreground flex items-center justify-center h-24">
        데이터가 없습니다
      </div>
    );
  }

  const allSelected = data.length > 0 && data.every((r) => selectedIds.has(r.product_id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox
              checked={allSelected}
              onCheckedChange={onToggleSelectAll}
            />
          </TableHead>
          <TableHead className="w-[80px]">작품ID</TableHead>
          <TableHead>작품명</TableHead>
          <TableHead className="w-[80px]">유저ID</TableHead>
          <TableHead className="w-[100px]">작가명</TableHead>
          <TableHead className="w-[100px]">장르</TableHead>
          <TableHead className="w-[70px]">회차수</TableHead>
          <TableHead className="w-[80px]">블라인드</TableHead>
          <TableHead className="w-[110px]">등록일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.product_id}>
            <TableCell>
              <Checkbox
                checked={selectedIds.has(row.product_id)}
                onCheckedChange={() => onToggleSelect(row.product_id)}
              />
            </TableCell>
            <TableCell>{row.product_id}</TableCell>
            <TableCell className="max-w-[240px] truncate">{row.title}</TableCell>
            <TableCell>{row.user_id}</TableCell>
            <TableCell>{row.author_name || "-"}</TableCell>
            <TableCell>{row.primary_genre || "-"}</TableCell>
            <TableCell>{row.episode_count ?? 0}</TableCell>
            <TableCell>
              <Switch
                checked={row.blind_yn === "Y"}
                onCheckedChange={(checked) =>
                  onToggleBlind(row.product_id, checked ? "Y" : "N")
                }
              />
            </TableCell>
            <TableCell>
              {row.created_date
                ? format(new Date(row.created_date), "yyyy.MM.dd")
                : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
