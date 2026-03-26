"use client";

import { useBulkPublishReserveEpisode } from "@/app/api/query/author/episode";
import Button from "@/components/common/Button";
import BottomSheetContainer from "@/components/common/BottomSheetContainer";
import ModalContainer from "@/components/common/ModalContainer";
import DatePicker from "@/components/form/datepicker";
import useMediaDevice from "@/hooks/useMediaDevice";
import useToastStore from "@/store/toastStore";
import { IEpisode } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

interface BulkReserveModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodes: IEpisode[];
  productId: number;
  onCompleted?: () => void;
}

interface ReserveRowState {
  episodeId: number;
  episodeNo: number;
  episodeTitle: string;
  currentReserveDate: string | null;
  publishReserveDate: Date | null;
}

const DEFAULT_START_HOUR = 7;
const MIN_RESERVE_MINUTES = 5;
const RESERVE_MINIMUM_MESSAGE = `예약공개는 현재 시간 기준 ${MIN_RESERVE_MINUTES}분 이후부터 설정할 수 있습니다.`;

const toFutureDefaultDate = () =>
  dayjs().add(1, "day").hour(DEFAULT_START_HOUR).minute(0).second(0).millisecond(0).toDate();

const getMinimumReserveAt = () => {
  const base = dayjs().add(MIN_RESERVE_MINUTES, "minute");
  const needsCeil = base.second() > 0 || base.millisecond() > 0;
  return (needsCeil ? base.add(1, "minute") : base).second(0).millisecond(0);
};

const getReserveValidationMessage = (value: Date | null) => {
  if (!value) return "예약공개 일시를 선택해주세요.";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return "유효한 예약공개 일시를 선택해주세요.";
  if (parsed.isBefore(getMinimumReserveAt())) {
    return RESERVE_MINIMUM_MESSAGE;
  }
  return null;
};

const formatRowTimeDraft = (value: Date | null) =>
  value ? dayjs(value).format("HH:mm") : "";

const normalizeTimeDraft = (raw: string) => {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const isCompleteTimeDraft = (raw: string) =>
  /^([01]\d|2[0-3]):([0-5]\d)$/.test(raw);

const buildTimeDraftMap = (nextRows: ReserveRowState[]) =>
  nextRows.reduce<Record<number, string>>((acc, row) => {
    acc[row.episodeId] = formatRowTimeDraft(row.publishReserveDate);
    return acc;
  }, {});

const formatCurrentReserve = (value?: string | null) => {
  if (!value) return "미설정";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return "미설정";
  return parsed.format("YYYY.MM.DD HH:mm");
};

const buildAutoScheduleRows = (episodes: IEpisode[], startAt: Date | null) =>
  episodes
    .slice()
    .sort((a, b) => a.episodeNo - b.episodeNo)
    .map((episode, index) => ({
      episodeId: episode.episodeId,
      episodeNo: episode.episodeNo,
      episodeTitle: episode.episodeTitle,
      currentReserveDate: episode.publishReserveDate || null,
      publishReserveDate: startAt
        ? dayjs(startAt).add(index, "day").second(0).millisecond(0).toDate()
        : null,
    }));

const BulkReserveModal = ({
  isOpen,
  onClose,
  episodes,
  productId,
  onCompleted,
}: BulkReserveModalProps) => {
  const device = useMediaDevice();
  const queryClient = useQueryClient();
  const { setToast } = useToastStore();
  const reserveMutation = useBulkPublishReserveEpisode();

  const initialStartAt = useMemo(() => {
    const futureReserved = episodes
      .map((episode) => episode.publishReserveDate)
      .filter((value): value is string => Boolean(value))
      .map((value) => dayjs(value))
      .filter((value) => value.isValid() && value.isAfter(dayjs()))
      .sort((a, b) => a.valueOf() - b.valueOf());

    if (futureReserved.length > 0) {
      return futureReserved[0].second(0).millisecond(0).toDate();
    }

    return toFutureDefaultDate();
  }, [episodes]);

  const [startAt, setStartAt] = useState<Date | null>(initialStartAt);
  const [rows, setRows] = useState<ReserveRowState[]>(() =>
    buildAutoScheduleRows(episodes, initialStartAt)
  );
  const [timeDraftMap, setTimeDraftMap] = useState<Record<number, string>>(() =>
    buildTimeDraftMap(buildAutoScheduleRows(episodes, initialStartAt))
  );
  const startAtValidationMessage = getReserveValidationMessage(startAt);
  const rowValidationMessages = rows.reduce<Record<number, string | null>>(
    (acc, row) => {
      acc[row.episodeId] = getReserveValidationMessage(row.publishReserveDate);
      return acc;
    },
    {}
  );
  const hasInvalidReserveRow = rows.some(
    (row) => Boolean(rowValidationMessages[row.episodeId])
  );

  useEffect(() => {
    if (!isOpen) return;

    const nextRows = buildAutoScheduleRows(episodes, initialStartAt);
    setStartAt(initialStartAt);
    setRows(nextRows);
    setTimeDraftMap(buildTimeDraftMap(nextRows));
  }, [episodes, initialStartAt, isOpen]);

  const handleChangeStartAt = (date: Date | null) => {
    const normalizedDate =
      date ? dayjs(date).second(0).millisecond(0).toDate() : null;
    const nextRows = buildAutoScheduleRows(episodes, normalizedDate);
    setStartAt(normalizedDate);
    setRows(nextRows);
    setTimeDraftMap(buildTimeDraftMap(nextRows));
  };

  const handleChangeRowDate = (episodeId: number, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.episodeId !== episodeId || !value) return row;
        const base = row.publishReserveDate ? dayjs(row.publishReserveDate) : dayjs();
        return {
          ...row,
          publishReserveDate: base
            .year(Number(value.slice(0, 4)))
            .month(Number(value.slice(5, 7)) - 1)
            .date(Number(value.slice(8, 10)))
            .second(0)
            .millisecond(0)
            .toDate(),
        };
      })
    );
  };

  const handleChangeRowTime = (episodeId: number, rawValue: string) => {
    const nextDraft = normalizeTimeDraft(rawValue);
    setTimeDraftMap((prev) => ({
      ...prev,
      [episodeId]: nextDraft,
    }));

    if (!isCompleteTimeDraft(nextDraft)) return;

    const [hour, minute] = nextDraft.split(":").map(Number);

    setRows((prev) =>
      prev.map((row) => {
        if (row.episodeId !== episodeId) return row;
        const base = row.publishReserveDate ? dayjs(row.publishReserveDate) : dayjs();
        return {
          ...row,
          publishReserveDate: base
            .hour(hour)
            .minute(minute)
            .second(0)
            .millisecond(0)
            .toDate(),
        };
      })
    );
  };

  const handleBlurRowTime = (episodeId: number) => {
    const targetRow = rows.find((row) => row.episodeId === episodeId);
    setTimeDraftMap((prev) => ({
      ...prev,
      [episodeId]: formatRowTimeDraft(targetRow?.publishReserveDate ?? null),
    }));
  };

  const handleSubmit = () => {
    if (!rows.length) {
      setToast({ message: "선택된 회차가 없습니다.", type: "error" });
      return;
    }

    const minimumReserveAt = getMinimumReserveAt();
    const invalidRow = rows.find(
      (row) =>
        !row.publishReserveDate ||
        !dayjs(row.publishReserveDate).isValid() ||
        dayjs(row.publishReserveDate).isBefore(minimumReserveAt)
    );

    if (invalidRow) {
      setToast({
        message: `${invalidRow.episodeNo}화 예약일시는 현재 시각 기준 ${MIN_RESERVE_MINUTES}분 이후로 설정해야 합니다.`,
        type: "error",
      });
      return;
    }

    reserveMutation.mutate(
      {
        schedules: rows.map((row) => ({
          episode_id: row.episodeId,
          publish_reserve_date: row.publishReserveDate as Date,
        })),
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["selectProductDetail", productId],
          });
          setToast({
            message: `${rows.length}개 회차 예약공개가 설정되었습니다.`,
            type: "success",
          });
          onCompleted?.();
          onClose();
        },
        onError: (error: any) => {
          setToast({
            message:
              error?.response?.data?.message ||
              "예약공개 일괄 설정에 실패했습니다.",
            type: "error",
          });
        },
      }
    );
  };

  const content = (
    <div className="bg-white md:w-[760px]">
      <div className="px-4 py-4 md:px-6 md:py-5 border-b border-light-gray-200">
        <div className="text-14pxr font-semibold text-dark-gray-500 mb-3">
          예약 시작일시
        </div>
        <DatePicker
          placeholder="시작일을 선택하세요."
          showTimeSelect
          inputStyle="h-[46px] md:h-[50px]"
          value={startAt ?? undefined}
          onChange={handleChangeStartAt}
        />
        <p className="text-12pxr text-gray-500 mt-2">
          첫 회차 기준으로 이후 선택 회차는 하루씩 자동 배치됩니다. 아래 행에서 개별 수정도 가능합니다.
        </p>
        <p
          className={`mt-1 text-12pxr ${
            startAtValidationMessage ? "text-red-100" : "text-dark-gray-200"
          }`}
        >
          {startAtValidationMessage || RESERVE_MINIMUM_MESSAGE}
        </p>
      </div>

      <div className="px-4 md:px-6 py-4">
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-3 text-12pxr text-dark-gray-300 font-semibold pb-2 border-b border-light-gray-200">
          <div>제목</div>
          <div>현재예약설정(KST)</div>
          <div>예약공개일시(KST)</div>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {rows.map((row) => (
            <div
              key={row.episodeId}
              className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-3 py-3 border-b border-light-gray-100 items-center"
            >
              <div className="min-w-0">
                <div className="text-14pxr font-semibold text-dark-gray-500 truncate">
                  {row.episodeTitle}
                </div>
                <div className="text-12pxr text-gray-500 mt-1">{row.episodeNo}화</div>
              </div>
              <div className="text-13pxr text-dark-gray-400">
                {formatCurrentReserve(row.currentReserveDate)}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="flex-1 min-w-0 h-[42px] px-3 border border-light-gray-500 rounded-[10px] text-13pxr text-dark-gray-500"
                    value={
                      row.publishReserveDate
                        ? dayjs(row.publishReserveDate).format("YYYY-MM-DD")
                        : ""
                    }
                    onChange={(event) =>
                      handleChangeRowDate(row.episodeId, event.target.value)
                    }
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="HH:mm"
                    className="w-[110px] h-[42px] px-3 border border-light-gray-500 rounded-[10px] text-13pxr text-dark-gray-500"
                    value={timeDraftMap[row.episodeId] ?? ""}
                    onChange={(event) =>
                      handleChangeRowTime(row.episodeId, event.target.value)
                    }
                    onBlur={() => handleBlurRowTime(row.episodeId)}
                  />
                </div>
                {rowValidationMessages[row.episodeId] ? (
                  <p className="text-12pxr text-red-100">
                    {rowValidationMessages[row.episodeId]}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-light-gray-200 px-4 py-4 md:px-6 flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={reserveMutation.isPending}>
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          isLoading={reserveMutation.isPending}
          disabled={reserveMutation.isPending || hasInvalidReserveRow}
        >
          예약설정 완료
        </Button>
      </div>
    </div>
  );

  if (!isOpen || device === null) return null;

  if (device === "mobile") {
    return (
      <BottomSheetContainer title="예약공개" isOpen={isOpen} onClose={onClose}>
        {content}
      </BottomSheetContainer>
    );
  }

  return (
    <ModalContainer title="예약공개" isOpen={isOpen} onClose={onClose} size="full">
      {content}
    </ModalContainer>
  );
};

export default BulkReserveModal;
