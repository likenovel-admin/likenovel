"use client";
import { Button } from "@/components/ui/button";
import { SidebarInset } from "@/components/ui/sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { AddKeywordPopup } from "./components/popup";
import { item_per_page } from "@/constants/common";
import { IGetKeywordParams } from "@/api/keyword/dto";
import { useGetKeywordCategories, useGetKeywords } from "@/api/keyword";
import { IKeyword } from "@/types/keyword";
import KeywordsTable from "@/app/products/theme-keyword/KeywordsTable";
import PaginationControls from "@/components/common/PaginationControls";
import FullPageLoader from "@/components/common/FullPageLoader";
import { SearchText } from "@/components/common/SearchText";
import { calculatePageCount } from "@/lib/utils";
import PageHeader from "@/components/ui/page-header";

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "all";
  const [filters, setFilers] = useState<IGetKeywordParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
  });
  const [showKeywordPopup, setShowKeywordPopup] = useState<{
    open: boolean;
    data: IKeyword | null;
  }>({
    open: false,
    data: null,
  });

  // const tabs = [

  //   {
  //     label: "장르",
  //     value: "genre",
  //   },
  //   {
  //     label: "소재",
  //     value: "subject",
  //   },
  //   {
  //     label: "주인공",
  //     value: "hero",
  //   },
  // ];

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetKeywords({
    page: filters.page,
    count_per_page: filters.count_per_page,
    status: tab || undefined,
    search_target: filters.search_target || undefined,
    search_word: filters.search_word || undefined,
  });
  const { data: dataCategories } = useGetKeywordCategories();

  const tabs = useMemo(() => {
    if (dataCategories) {
      return dataCategories.map((item) => {
        return {
          label: item.category_name,
          value: item.category_code + "",
        };
      });
    }
    return [];
  }, [dataCategories]);

  useEffect(() => {
    refetch();
  }, [filters]);

  const handleOpenKeywordPopup = (data: IKeyword | null) => {
    setShowKeywordPopup({ open: true, data });
  };

  const handleCloseKeywordPopup = () => {
    setShowKeywordPopup({ open: false, data: null });
  };

  const handleChangePage = (page: number) => {
    setFilers({
      ...filters,
      page,
    });
  };

  const handleOnSearch = (filters: IGetKeywordParams) => {
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

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="테마 키워드 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4">
            {[
              {
                label: "전체",
                value: "all",
              },
              ...tabs,
            ].map((item, index) => (
              <Button
                key={`tab-${index}`}
                variant={tab == item.value ? "default" : "outline"}
                onClick={() => {
                  route.push(`/products/theme-keyword?tab=${item.value}`);
                  handleOnReset();
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 justify-between">
            <SearchText
              options={[{ value: "tag-name", label: "태그명" }]}
              onSearch={handleOnSearch}
              onReset={handleOnReset}
            />
            <Button onClick={() => handleOpenKeywordPopup(null)}>
              + 키워드 추가
            </Button>
          </div>
          <KeywordsTable
            data={data?.results ?? []}
            loading={isLoadingData || isFetching}
            refetch={() => {
              refetch();
            }}
            handleOpenKeywordPopup={handleOpenKeywordPopup}
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
      </SidebarInset>
      {showKeywordPopup.open && (
        <AddKeywordPopup
          data={showKeywordPopup.data}
          close={() => handleCloseKeywordPopup()}
          refetch={() => {
            refetch();
          }}
        />
      )}
    </>
  );
}

export default function SuspensePage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
