"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import BannerThumbnailPreview from "@/app/banners/BannerThumbnailPreview";
import { bannerPosition } from "@/enums/banner";
import { formatDateRange } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IBanner } from "@/types/banner";
import { useEffect, useState } from "react";

interface Props {
  data: IBanner[];
  onOrderChange: (nextOrdered: IBanner[]) => void;
}

function DragHandle({ listeners, attributes }: any) {
  return (
    <button
      type="button"
      className="cursor-grab active:cursor-grabbing px-2 py-1 text-lg text-muted-foreground hover:text-foreground"
      aria-label="드래그로 순서 변경"
      {...listeners}
      {...attributes}
    >
      ≡
    </button>
  );
}

function SortableBannerRow({
  row,
  index,
  totalCount,
  onMoveToPosition,
}: {
  row: IBanner;
  index: number;
  totalCount: number;
  onMoveToPosition: (id: number, rawPosition: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <DragHandle listeners={listeners} attributes={attributes} />
      </TableCell>
      <TableCell>{index + 1}</TableCell>
      <TableCell>
        <input
          key={`${row.id}-${index}`}
          type="number"
          min={1}
          max={totalCount}
          defaultValue={index + 1}
          className="h-9 w-16 rounded-md border bg-background px-2 text-center text-sm"
          aria-label={`${row.title} 위치 입력`}
          onBlur={(event) => onMoveToPosition(row.id, event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </TableCell>
      <TableCell>
        {row.position
          ? bannerPosition[
              `${row.position}${row.division ? `-${row.division}` : ""}`
            ]
          : ""}
      </TableCell>
      <TableCell>{row.title}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <BannerThumbnailPreview
            src={row.image_path}
            label="PC"
            alt={`${row.title} PC 배너`}
          />
          <BannerThumbnailPreview
            src={row.mobile_image_path}
            label="MO"
            alt={`${row.title} 모바일 배너`}
            className="h-10 w-8"
          />
        </div>
      </TableCell>
      <TableCell>{formatDateRange(row.show_start_date, row.show_end_date)}</TableCell>
      <TableCell>{row.show === "Y" ? "활성" : "비활성"}</TableCell>
    </TableRow>
  );
}

export default function SortableBannersTable({ data, onOrderChange }: Props) {
  const [items, setItems] = useState<IBanner[]>(data);

  useEffect(() => {
    setItems(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    onOrderChange(next);
  };

  const handleMoveToPosition = (id: number, rawPosition: string) => {
    if (!rawPosition.trim()) return;

    const parsed = Number(rawPosition);
    if (!Number.isFinite(parsed)) return;

    const oldIdx = items.findIndex((item) => item.id === id);
    if (oldIdx < 0) return;

    const nextPosition = Math.max(1, Math.min(items.length, Math.trunc(parsed)));
    const newIdx = nextPosition - 1;
    if (oldIdx === newIdx) return;

    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    onOrderChange(next);
  };

  if (!items || items.length === 0) {
    return (
      <div className="px-4 py-2 text-center text-sm text-muted-foreground flex items-center justify-center h-24">
        순서를 변경할 항목이 없습니다.
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"> </TableHead>
            <TableHead className="w-16">순서</TableHead>
            <TableHead className="w-28">위치 입력</TableHead>
            <TableHead>노출 위치</TableHead>
            <TableHead>배너명</TableHead>
            <TableHead>썸네일</TableHead>
            <TableHead>노출 기간</TableHead>
            <TableHead>상태</TableHead>
          </TableRow>
        </TableHeader>
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <TableBody>
            {items.map((row, idx) => (
              <SortableBannerRow
                key={row.id}
                row={row}
                index={idx}
                totalCount={items.length}
                onMoveToPosition={handleMoveToPosition}
              />
            ))}
          </TableBody>
        </SortableContext>
      </Table>
    </DndContext>
  );
}
