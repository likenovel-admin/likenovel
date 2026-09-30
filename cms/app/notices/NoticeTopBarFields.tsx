"use client";

import { Input } from "@/components/ui/input";
import { TableCell, TableHead, TableRow } from "@/components/ui/table";
import {
  NOTICE_TOP_BAR_TEXT_MAX_LENGTH,
  type NoticeTopBarState,
} from "./noticeTopBar";

interface Props {
  value: NoticeTopBarState;
  onChange: (next: NoticeTopBarState) => void;
}

// 공지 작성/수정 화면의 "상단 띠 공지" 입력. 띠를 누르면 이 공지 상세로 이동한다.
export default function NoticeTopBarFields({ value, onChange }: Props) {
  const update = (patch: Partial<NoticeTopBarState>) =>
    onChange({ ...value, ...patch });
  const textLength = value.text.trim().length;

  return (
    <TableRow>
      <TableHead>상단 띠 공지</TableHead>
      <TableCell>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2" htmlFor="top-bar-enabled">
            <Input
              type="checkbox"
              id="top-bar-enabled"
              className="w-[20px]"
              checked={value.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
            />
            <span>사이트 맨 위에 띠로 노출합니다. 띠를 누르면 이 공지로 이동합니다.</span>
          </label>
          {value.enabled ? (
            <>
              <div className="flex items-center gap-2">
                <label htmlFor="top-bar-text" className="w-[56px] shrink-0 text-sm">
                  띠 문구
                </label>
                <Input
                  id="top-bar-text"
                  value={value.text}
                  maxLength={NOTICE_TOP_BAR_TEXT_MAX_LENGTH}
                  placeholder="예: 웹소챗 장애 보상으로 이벤트 캐시를 드렸어요"
                  onChange={(e) => update({ text: e.target.value })}
                />
                <span className="w-[64px] shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {textLength}/{NOTICE_TOP_BAR_TEXT_MAX_LENGTH}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="shrink-0">노출 기간</span>
                <Input
                  type="datetime-local"
                  id="top-bar-start"
                  aria-label="상단 띠 노출 시작"
                  className="w-[220px]"
                  value={value.startAt}
                  onChange={(e) => update({ startAt: e.target.value })}
                />
                <span>~</span>
                <Input
                  type="datetime-local"
                  id="top-bar-end"
                  aria-label="상단 띠 노출 종료"
                  className="w-[220px]"
                  value={value.endAt}
                  onChange={(e) => update({ endAt: e.target.value })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                시작을 비우면 저장한 시각부터, 종료를 비우면 체크를 끌 때까지 노출됩니다. 기간이 겹치면 가장 최근에 시작한 1개만 보이고, 그 띠가 끝나면 기간이 남은 다른 띠가 이어서 보입니다. 체크를 끄고 저장하면 문구와 기간도 지워집니다. 이미 열려 있는 화면에는 최대 1분 안에 반영됩니다.
              </p>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">미리보기</span>
                <div className="relative flex h-9 items-center justify-center rounded bg-[#176BF2] px-10 text-[13px] font-medium text-white">
                  <span className="truncate">
                    {value.text.trim() || "상단 띠 문구가 여기에 보입니다"}
                  </span>
                  <span aria-hidden className="absolute right-3 text-base leading-none opacity-80">
                    ×
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
