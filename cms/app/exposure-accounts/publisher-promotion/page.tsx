"use client";
import { Button } from "@/components/ui/button";
import {
  useEditPublisherPromotionConfig,
  useGetPublisherPromotionConfig,
} from "@/api/publisherPromotion";
import { SidebarInset } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import { item_per_page } from "@/constants/common";
import { useGetPublisherPromotions } from "@/api/publisherPromotion";
import { IGetPublisherPromotionParams } from "@/api/publisherPromotion/dto";
import { SearchText } from "@/components/common/SearchText";
import PublisherPromotionTable from "@/app/exposure-accounts/publisher-promotion/PublisherPromotionTable";
import PaginationControls from "@/components/common/PaginationControls";
import { calculatePageCount, catchErrorMessage, showAlert } from "@/lib/utils";
import FullPageLoader from "@/components/common/FullPageLoader";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [filters, setFilers] = useState<IGetPublisherPromotionParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [slotTitle, setSlotTitle] = useState("");

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetPublisherPromotions({
    page: filters.page,
    count_per_page: filters.count_per_page,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });
  const { data: configData, refetch: refetchConfig } =
    useGetPublisherPromotionConfig();
  const editPublisherPromotionConfig = useEditPublisherPromotionConfig();

  useEffect(() => {
    refetch();
  }, [filters]);

  useEffect(() => {
    setSlotTitle(configData?.data?.title || "");
  }, [configData]);

  const handleChangePage = (page: number) => {
    setFilers({
      ...filters,
      page,
    });
  };

  const handleOnSearch = (filters: IGetPublisherPromotionParams) => {
    setFilers(filters);
  };
  const handleOnReset = () => {
    setFilers({
      page: 1,
      count_per_page: item_per_page,
      search_target: "",
      search_word: "",
    });
  };

  const handleSaveSlotTitle = () => {
    const normalizedTitle = slotTitle.trim();
    if (editPublisherPromotionConfig.isPending) {
      return;
    }
    if (!normalizedTitle) {
      showAlert("오류", "구좌명을 입력해주세요.", "확인");
      return;
    }
    editPublisherPromotionConfig.mutate(
      { title: normalizedTitle },
      {
        onSuccess: async () => {
          await refetchConfig();
          setIsConfigOpen(false);
        },
        onError: (error: any) => {
          showAlert("오류", catchErrorMessage(error), "확인");
        },
      }
    );
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="출판사 프로모션 구좌 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchText
              options={[
                { value: "author-name", label: "작가명" },
                { value: "product-title", label: "작품명" },
              ]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsConfigOpen(true)}>
                구좌명 편집
              </Button>
              <Button
                onClick={() =>
                  route.push("/exposure-accounts/publisher-promotion/add")
                }
              >
                + 작품 추가
              </Button>
            </div>
          </div>
          <PublisherPromotionTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => {
              refetch();
            }}
            currentPage={filters.page || 1}
            pageSize={filters.count_per_page || 8}
            totalCount={data?.total_count ?? 0}
          />
          <PaginationControls
            page={filters.page || 1}
            setPage={handleChangePage}
            totalPages={calculatePageCount(
              data?.total_count || 0,
              filters.count_per_page || 8
            )}
          />
          <FullPageLoader isLoading={isLoadingData || isFetching} />
        </div>
        <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>출판사 프로모션 구좌명 편집</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Input
                value={slotTitle}
                onChange={(event) => setSlotTitle(event.target.value)}
                placeholder="구좌명을 입력하세요"
                maxLength={100}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveSlotTitle}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <FullPageLoader isLoading={editPublisherPromotionConfig.isPending} />
      </SidebarInset>
    </>
  );
}
