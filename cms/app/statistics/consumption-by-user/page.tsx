"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import PageHeader from "@/components/ui/page-header";
import PaginationControls from "@/components/common/PaginationControls";
import FullPageLoader from "@/components/common/FullPageLoader";
import { SearchDateNText } from "@/components/common/SearchDateNText";

import {
  cancelCashOrderByOrderId,
  getStatisticPaymentByUserDownload,
  useGetStatisticPaymentByUser,
} from "@/api/statistic";
import { IGetStatisticPaymentByUserParams } from "@/api/statistic/dto";
import { item_per_page } from "@/constants/common";
import { downloadExcel } from "@/lib/excelDownload";
import {
  calculatePageCount,
  catchErrorMessage,
  confirm,
  showAlert,
} from "@/lib/utils";
import StatisticsTable from "@/app/statistics/consumption-by-user/StatisticsTable";
import { IStatisticPaymentByUser } from "@/types/statistic";

const getRowKey = (row: IStatisticPaymentByUser, rowIndex: number) => {
  const orderId = row.cash_order_id ?? row.cashOrderId;
  if (orderId !== undefined && orderId !== null) {
    return `order-${orderId}`;
  }

  const userKey = row.user_id ?? row.userId ?? row.email ?? "unknown";
  return `${row.date}-${userKey}-${rowIndex}`;
};

export default function Page() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const [filters, setFilers] = useState<IGetStatisticPaymentByUserParams>({
    page: 1,
    count_per_page: item_per_page,
    start_date: undefined,
    end_date: undefined,
    search_target: "",
    search_word: "",
  });

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<IStatisticPaymentByUser | null>(
    null
  );

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetStatisticPaymentByUser({
    page: filters.page,
    count_per_page: filters.count_per_page,
    start_date: filters.start_date
      ? format(filters.start_date, "yyyy-MM-dd")
      : undefined,
    end_date: filters.end_date
      ? format(filters.end_date, "yyyy-MM-dd")
      : undefined,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });

  useEffect(() => {
    refetch();
  }, [filters]);

  const clearSelection = () => {
    setSelectedRowKey(null);
    setSelectedRow(null);
  };

  const handleToggleSelectionMode = () => {
    const nextMode = !selectionMode;
    setSelectionMode(nextMode);

    if (!nextMode) {
      clearSelection();
    }
  };

  const handleSelectRow = (
    row: IStatisticPaymentByUser,
    rowIndex: number,
    checked: boolean
  ) => {
    if (!checked) {
      clearSelection();
      return;
    }

    setSelectedRow(row);
    setSelectedRowKey(getRowKey(row, rowIndex));
  };

  const handleCancelSelectedPayment = async () => {
    if (!selectedRow) {
      showAlert("안내", "결제취소할 행을 선택해주세요.", "확인");
      return;
    }

    const orderId = selectedRow.cash_order_id ?? selectedRow.cashOrderId;
    if (orderId === undefined || orderId === null) {
      showAlert(
        "안내",
        "선택한 행에 결제취소 가능한 주문 정보가 없습니다.",
        "확인"
      );
      return;
    }

    const result = await confirm({
      title: "결제취소",
      text: "선택한 결제를 취소하시겠습니까?",
      confirm: "확인",
      cancel: "취소",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setIsCanceling(true);

      await cancelCashOrderByOrderId(Number(orderId), {
        reason: "CMS admin cancellation from consumption-by-user page",
      });

      await showAlert("완료", "결제취소가 완료되었습니다.", "확인");
      clearSelection();
      setSelectionMode(false);
      refetch();
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleDownloadExcel = async () => {
    await downloadExcel({
      apiFn: getStatisticPaymentByUserDownload,
      params: {
        start_date: filters.start_date
          ? format(filters.start_date, "yyyy-MM-dd")
          : undefined,
        end_date: filters.end_date
          ? format(filters.end_date, "yyyy-MM-dd")
          : undefined,
        search_target: filters.search_target || undefined,
        search_word: filters.search_word || undefined,
      },
      headers: [
        "주문시각",
        "주문번호",
        "이메일",
        "닉네임",
        "결제 횟수",
        "결제 코인",
        "결제 금액",
      ],
      fields: [
        "order_datetime",
        "order_no",
        "email",
        "nickname",
        "pay_count",
        "pay_coin",
        "pay_amount",
      ],
      filename: "회원별 소비 내역",
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
      onError: (error) => {
        showAlert("오류", catchErrorMessage(error), "확인");
      },
    });
  };

  const handleChangePage = (page: number) => {
    clearSelection();
    setFilers({
      ...filters,
      page,
    });
  };

  const handleOnSearch = (nextFilters: IGetStatisticPaymentByUserParams) => {
    clearSelection();
    setSelectionMode(false);
    setFilers(nextFilters);
  };

  const handleOnReset = () => {
    clearSelection();
    setSelectionMode(false);
    setFilers({
      page: 1,
      count_per_page: item_per_page,
      start_date: undefined,
      end_date: undefined,
      search_target: "",
      search_word: "",
    });
  };

  return (
    <SidebarInset className="bg-sidebar-inset-background">
      <PageHeader title="회원별 소비 내역" />
      <div className="flex flex-1 flex-col gap-8 p-4 pt-0">
        <div className="flex justify-between">
          <SearchDateNText
            options={[
              { value: "email", label: "이메일" },
              { value: "nickname", label: "닉네임" },
            ]}
            onSearch={handleOnSearch}
            onReset={handleOnReset}
          />

          <div className="flex items-center gap-2">
            {selectedRowKey && (
              <Button
                variant="destructive"
                onClick={handleCancelSelectedPayment}
                disabled={isCanceling}
              >
                결제취소
              </Button>
            )}

            <Button variant="outline" onClick={handleToggleSelectionMode}>
              {selectionMode ? "선택해제" : "선택"}
            </Button>

            <Button variant="outline" onClick={handleDownloadExcel}>
              엑셀 다운로드
            </Button>
          </div>
        </div>

        <StatisticsTable
          data={data?.results ?? []}
          loading={isLoadingData || isFetching}
          selectionMode={selectionMode}
          selectedRowKey={selectedRowKey}
          onSelectRow={handleSelectRow}
        />

        <PaginationControls
          page={filters.page || 1}
          setPage={handleChangePage}
          totalPages={calculatePageCount(
            data?.total_count || 0,
            filters.count_per_page || item_per_page
          )}
        />

        <FullPageLoader
          isLoading={isLoading || isCanceling || isLoadingData || isFetching}
        />
      </div>
    </SidebarInset>
  );
}
