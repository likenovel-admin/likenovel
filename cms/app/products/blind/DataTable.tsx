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
import { Button } from "@/components/ui/button";

interface Props {
  data: IBlindProduct[];
  loading?: boolean;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onToggleOpen: (productId: number, openYn: string) => void;
  onToggleBlind: (productId: number, blindYn: string) => void;
  onDownloadTxt: (productId: number) => void;
  downloadingProductId?: number | null;
}

export default function BlindDataTable({
  data,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onToggleOpen,
  onToggleBlind,
  onDownloadTxt,
  downloadingProductId,
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
          <TableHead className="w-[180px]">작가명</TableHead>
          <TableHead className="w-[220px]">이메일</TableHead>
          <TableHead className="w-[100px]">장르</TableHead>
          <TableHead className="w-[70px]">회차수</TableHead>
          <TableHead className="w-[80px]">공개</TableHead>
          <TableHead className="w-[80px]">블라인드</TableHead>
          <TableHead className="w-[110px]">등록일</TableHead>
          <TableHead className="w-[120px]">작가 전달 TXT</TableHead>
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
            <TableCell className="max-w-[180px] truncate">{row.author_name || "-"}</TableCell>
            <TableCell className="max-w-[220px] truncate">{row.author_email || "-"}</TableCell>
            <TableCell>{row.primary_genre || "-"}</TableCell>
            <TableCell>{row.episode_count ?? 0}</TableCell>
            <TableCell>
              <Switch
                checked={row.open_yn === "Y"}
                disabled={row.blind_yn === "Y"}
                onCheckedChange={(checked) =>
                  onToggleOpen(row.product_id, checked ? "Y" : "N")
                }
              />
            </TableCell>
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
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadTxt(row.product_id)}
                disabled={downloadingProductId === row.product_id}
              >
                {downloadingProductId === row.product_id ? "다운로드 중" : "다운로드"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
