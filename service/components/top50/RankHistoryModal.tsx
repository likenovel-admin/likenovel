"use client";

import {
  TTop50Area,
  useSelectTop50RankHistory,
} from "@/app/api/query/top50";
import type {
  ITop50RankHistoryBasisTime,
  ITop50RankHistoryRow,
} from "@/app/api/query/top50";
import Spinner from "@/components/common/Spinner";

const AREA_LABELS: Record<TTop50Area, string> = {
  freeSerialTop: "무료연재 TOP50",
  paidSerialTop: "유료연재 TOP50",
  paidEndTop: "연재완결 TOP50",
  paidStandaloneTop: "단행본 TOP50",
};

const buildFullDayBasisTimes = (
  selectedDate: string
): ITop50RankHistoryBasisTime[] =>
  Array.from({ length: 24 }, (_, hour) => {
    const paddedHour = `${hour}`.padStart(2, "0");
    return {
      basisAt: `${selectedDate} ${paddedHour}:30:00`,
      label: `${paddedHour}시`,
    };
  });

const buildFullDayRows = ({
  rows,
  basisTimes,
  limit,
}: {
  rows: ITop50RankHistoryRow[];
  basisTimes: ITop50RankHistoryBasisTime[];
  limit: number;
}): ITop50RankHistoryRow[] => {
  const sourceRows =
    rows.length > 0
      ? rows
      : Array.from({ length: limit }, (_, index) => ({
          rankNo: index + 1,
          cells: [],
        }));

  return sourceRows.map((row) => {
    const cellsByBasisAt = new Map(
      row.cells
        .filter((cell) => cell !== null)
        .map((cell) => [cell.basisAt, cell])
    );

    return {
      rankNo: row.rankNo,
      cells: basisTimes.map((basisTime) => {
        return cellsByBasisAt.get(basisTime.basisAt) ?? null;
      }),
    };
  });
};

interface Props {
  open: boolean;
  area: TTop50Area;
  date: string;
  onDateChange: (date: string) => void;
  onClose: () => void;
}

export default function RankHistoryModal({
  open,
  area,
  date,
  onDateChange,
  onClose,
}: Props) {
  const { data, isError, isPending, refetch } = useSelectTop50RankHistory({
    productAreaType: area,
    date,
    enabled: open,
  });

  if (!open) return null;

  const history = data?.data;
  const basisTimes = buildFullDayBasisTimes(history?.date ?? date);
  const rows = buildFullDayRows({
    rows: history?.rows ?? [],
    basisTimes,
    limit: history?.limit ?? 50,
  });
  const hasRankingHistory = (history?.basisTimes ?? []).length > 0;

  return (
    <div className="hidden md:flex fixed inset-0 z-[1000] items-center justify-center bg-black/50 px-40pxr">
      <div className="w-full max-w-[1180px] max-h-[86vh] overflow-hidden rounded-[20px] bg-white shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between gap-20pxr border-b border-light-gray-300 px-30pxr py-22pxr">
          <div>
            <h2 className="text-24pxr font-bold text-black-100">
              시간대별 랭킹
            </h2>
            <p className="mt-6pxr text-14pxr text-dark-gray-400">
              {AREA_LABELS[area]} · 시간대별 Top50 기록
            </p>
          </div>
          <div className="flex items-center gap-10pxr">
            <input
              type="date"
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              className="h-[40px] rounded-[8px] border border-light-gray-400 px-12pxr text-14pxr text-black-100 outline-none"
            />
            <button
              type="button"
              onClick={onClose}
              className="h-[40px] rounded-[8px] bg-black-100 px-18pxr text-14pxr font-semibold text-white"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="p-24pxr">
          {isPending ? (
            <div className="flex h-[360px] items-center justify-center">
              <Spinner />
            </div>
          ) : isError ? (
            <div className="flex h-[360px] flex-col items-center justify-center rounded-[16px] bg-light-gray-100 text-center">
              <p className="text-18pxr font-semibold text-black-100">
                랭킹 기록을 불러오지 못했습니다.
              </p>
              <p className="mt-8pxr text-14pxr text-dark-gray-400">
                잠시 후 다시 시도하세요.
              </p>
              <button
                type="button"
                className="mt-18pxr h-[38px] rounded-full bg-black-100 px-18pxr text-14pxr font-semibold text-white"
                onClick={() => refetch()}
              >
                다시 불러오기
              </button>
            </div>
          ) : (
            <div
              className="max-h-[calc(86vh-145px)] overflow-auto rounded-[12px] border border-light-gray-300"
              style={{ scrollbarGutter: "stable" }}
            >
              {!hasRankingHistory && (
                <div className="border-b border-light-gray-300 bg-light-gray-100 px-14pxr py-10pxr text-13pxr text-dark-gray-400">
                  저장된 기록이 없는 시간대는 -로 표시됩니다.
                </div>
              )}
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-light-gray-100">
                    <th className="sticky left-0 top-0 z-30 w-[70px] min-w-[70px] border-r border-light-gray-300 bg-light-gray-100 px-12pxr py-12pxr text-center text-14pxr font-bold text-black-100">
                      순위
                    </th>
                    {basisTimes.map((basisTime) => (
                      <th
                        key={basisTime.basisAt}
                        className="sticky top-0 z-20 w-[150px] min-w-[150px] border-r border-light-gray-300 bg-light-gray-100 px-12pxr py-12pxr text-center text-14pxr font-bold text-black-100 last:border-r-0"
                      >
                        {basisTime.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.rankNo} className="border-t border-light-gray-300">
                      <td className="sticky left-0 z-10 border-r border-light-gray-300 bg-white px-12pxr py-10pxr text-center text-16pxr font-bold text-black-100">
                        {row.rankNo}
                      </td>
                      {row.cells.map((cell, index) => (
                        <td
                          key={`${row.rankNo}-${basisTimes[index]?.basisAt ?? index}`}
                          className="h-[64px] border-r border-light-gray-300 px-10pxr py-8pxr align-top last:border-r-0"
                        >
                          {cell ? (
                            <div
                              className="max-w-[130px]"
                              title={`${cell.title} / ${cell.authorNickname || "-"}`}
                            >
                              <p className="truncate text-14pxr font-semibold leading-[18px] text-black-100">
                                {cell.title}
                              </p>
                              <p className="mt-4pxr truncate text-12pxr leading-[16px] text-dark-gray-300">
                                {cell.authorNickname || "-"}
                              </p>
                            </div>
                          ) : (
                            <span className="block text-center text-13pxr text-dark-gray-200">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
