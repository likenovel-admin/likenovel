"use client";
import {
  downloadCSVSetTopics,
  downloadCSVSimilar,
  downloadCSVUsers,
  uploadCSVSetTopic,
  uploadCSVSimilar,
  uploadCSVUsers,
  useGetAlgorithmSections,
  useGetAlgorithmSetTopics,
  useGetAlgorithmSimilar,
  useGetAlgorithmUsers,
} from "@/api/algorithm";
import { IGetAlgorithmParams } from "@/api/algorithm/dto";
import AlgorithmUserTable, {
  AlgorithmSectionTable,
  AlgorithmSetTopicTable,
  AlgorithmSimilarTable,
} from "@/app/exposure-accounts/algorithm-recommend/DataTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import PaginationControls from "@/components/common/PaginationControls";
import { SearchText } from "@/components/common/SearchText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { item_per_page } from "@/constants/common";
import {
  calculatePageCount,
  catchErrorMessage,
  daysFromToday,
  showAlert,
} from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  Suspense,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { reducer } from "./reducer";
import { IAlgorithmSection } from "@/types/algorithm";
import { downloadFile, getKoreanFileName } from "@/lib/fileDownload";

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tab = searchParams.get("tab") ?? "user";
  const [filters, setFilers] = useState<IGetAlgorithmParams>({
    page: 1,
    count_per_page: item_per_page,
    search_target: "",
    search_word: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const [algorithmSectionData, dispatch] = useReducer(
    reducer,
    [] as IAlgorithmSection[]
  );

  const {
    data: dataUser,
    refetch: refetchUser,
    isLoading: isLoadingUser,
    isFetching: isFetchingUser,
  } = useGetAlgorithmUsers(
    {
      page: filters.page,
      count_per_page: filters.count_per_page,
      search_target: filters.search_target || undefined,
      search_word: filters.search_word || undefined,
    },
    tab === "user" ? true : false
  );
  const {
    data: dataSetTopic,
    refetch: refetchSetTopic,
    isLoading: isLoadingSetTopic,
    isFetching: isFetchingSetTopic,
  } = useGetAlgorithmSetTopics(
    {
      page: filters.page,
      count_per_page: filters.count_per_page,
      search_target: filters.search_target || undefined,
      search_word: filters.search_word || undefined,
    },
    tab === "set-theme" ? true : false
  );

  const {
    data: dataSection,
    refetch: refetchSection,
    isLoading: isLoadingSection,
    isFetching: isFetchingSection,
  } = useGetAlgorithmSections(
    {
      page: filters.page,
      count_per_page: filters.count_per_page,
    },
    tab === "recommend-section" ? true : false
  );

  const {
    data: dataSimilar,
    refetch: refetchSimilar,
    isLoading: isLoadingSimilar,
    isFetching: isFetchingSimilar,
  } = useGetAlgorithmSimilar(
    {
      search_target: filters.search_target || undefined,
      search_word: filters.search_word || undefined,
      page: filters.page,
      count_per_page: filters.count_per_page,
      type:
        tab === "recommend-1"
          ? "content"
          : tab === "recommend-2"
            ? "genre"
            : "cart",
    },
    tab === "recommend-1" || tab === "recommend-2" || tab === "recommend-3"
      ? true
      : false
  );

  useEffect(() => {
    if (dataSection) {
      dispatch({
        type: "SET_INITIAL_STATE",
        payload: (dataSection.results || []) as IAlgorithmSection[],
      });
    }
  }, [dataSection]);

  useEffect(() => {
    if (tab === "user") {
      refetchUser();
    }
    if (tab === "set-theme") {
      refetchSetTopic();
    }
    if (
      tab === "recommend-1" ||
      tab === "recommend-2" ||
      tab === "recommend-3"
    ) {
      refetchSimilar();
    }
  }, [filters, tab]);

  const handleChangePage = (page: number) => {
    setFilers({
      ...filters,
      page,
    });
  };

  const handleOnSearch = (filters: IGetAlgorithmParams) => {
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

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      // if (type === "user") {
      //   await downloadCSVUsers();
      // }
      // if (type === "set-theme") {
      //   await downloadCSVSetTopics();
      // }
      // if (
      //   type === "recommend-1" ||
      //   type === "recommend-2" ||
      //   type === "recommend-3"
      // ) {
      //   await downloadCSVSimilar(type);
      // }
      const api =
        tab === "user"
          ? () => downloadCSVUsers()
          : tab === "set-theme"
            ? () => downloadCSVSetTopics()
            : tab === "recommend-1"
              ? () => downloadCSVSimilar("content")
              : tab === "recommend-2"
                ? () => downloadCSVSimilar("genre")
                : () => downloadCSVSimilar("cart");
      const fileName = getKoreanFileName(tab);
      await downloadFile({
        apiFunc: api,
        defaultFileName: fileName,
        onLoading: setIsLoading,
        onError: (error) => {
          showAlert("오류", catchErrorMessage(error), "확인");
        },
      });
      setIsLoading(false);
    } catch (error) {
      showAlert("오류", catchErrorMessage(error), "확인");
      setIsLoading(false);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        setIsLoading(true);
        if (tab === "user") {
          await uploadCSVUsers(formData);
          await refetchUser();
        }
        if (tab === "set-theme") {
          await uploadCSVSetTopic(formData);
          await refetchSetTopic();
        }
        if (
          tab === "recommend-1" ||
          tab === "recommend-2" ||
          tab === "recommend-3"
        ) {
          await uploadCSVSimilar({
            type:
              tab === "recommend-1"
                ? "content"
                : tab === "recommend-2"
                  ? "genre"
                  : "cart",
            form: formData,
          });
          await refetchSimilar();
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setIsLoading(false);
      } catch (error) {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        showAlert("오류", catchErrorMessage(error), "확인");
        setIsLoading(false);
      }
    }
  };

  const handleChangeFeature = (id: string, field: string, value: string) => {
    dispatch({
      type: "EDIT_FEATURE",
      payload: {
        id,
        field,
        value,
      },
    });
  };

  const renderSearch = () => {
    if (tab === "user") {
      return (
        <SearchText
          options={[{ value: "email", label: "이메일" }]}
          onSearch={handleOnSearch}
          onReset={handleOnReset}
        />
      );
    }
    if (tab === "set-theme") {
      return (
        <SearchText
          options={[{ value: "product_id", label: "작품 ID" }]}
          onSearch={handleOnSearch}
          onReset={handleOnReset}
        />
      );
    }
    if (
      tab === "recommend-1" ||
      tab === "recommend-2" ||
      tab === "recommend-3"
    ) {
      return (
        <SearchText
          options={[{ value: "product-id", label: "작품ID" }]}
          onSearch={handleOnSearch}
          onReset={handleOnReset}
        />
      );
    }
    return null;
  };

  const tabs = [
    {
      label: "유저 테이블",
      value: "user",
      component: function () {
        return (
          <>
            <AlgorithmUserTable
              data={dataUser?.results ?? []}
              loading={isLoadingUser || isFetchingUser}
            />
            <PaginationControls
              page={filters.page || 1}
              setPage={handleChangePage}
              totalPages={calculatePageCount(
                dataUser?.total_count || 0,
                filters.count_per_page || 8
              )}
            />
          </>
        );
      },
    },
    {
      label: "주제 설정 테이블",
      value: "set-theme",
      component: function () {
        return (
          <>
            <AlgorithmSetTopicTable
              data={dataSetTopic?.results ?? []}
              loading={isLoadingSetTopic || isFetchingSetTopic}
            />
            <PaginationControls
              page={filters.page || 1}
              setPage={handleChangePage}
              totalPages={calculatePageCount(
                dataSetTopic?.total_count || 0,
                filters.count_per_page || 8
              )}
            />
          </>
        );
      },
    },
    {
      label: "추천 섹션",
      value: "recommend-section",
      component: function () {
        return (
          <>
            <AlgorithmSectionTable
              data={algorithmSectionData ?? []}
              loading={isLoadingSection || isFetchingSection}
              refetch={() => {
                refetchSection();
              }}
              handleChangeFeature={handleChangeFeature}
              currentPage={filters.page || 1}
              pageSize={filters.count_per_page || 8}
              totalCount={dataSection?.total_count ?? 0}
            />
          </>
        );
      },
    },
    {
      label: "추천1 - 내용비슷",
      value: "recommend-1",
      component: function () {
        return (
          <>
            <span>
              최근 업데이트 :{" "}
              {daysFromToday(dataSimilar?.latest_updated_date || "")}일 전
            </span>
            <AlgorithmSimilarTable
              data={dataSimilar?.results ?? []}
              loading={isLoadingUser || isFetchingUser}
            />
            <PaginationControls
              page={filters.page || 1}
              setPage={handleChangePage}
              totalPages={calculatePageCount(
                dataSimilar?.total_count || 0,
                filters.count_per_page || 8
              )}
            />
          </>
        );
      },
    },
    {
      label: "추천2 - 장르비슷",
      value: "recommend-2",
      component: function () {
        return (
          <>
            <span>
              최근 업데이트 :{" "}
              {daysFromToday(dataSimilar?.latest_updated_date || "")}일 전
            </span>
            <AlgorithmSimilarTable
              data={dataSimilar?.results ?? []}
              loading={isLoadingUser || isFetchingUser}
            />
            <PaginationControls
              page={filters.page || 1}
              setPage={handleChangePage}
              totalPages={calculatePageCount(
                dataSimilar?.total_count || 0,
                filters.count_per_page || 8
              )}
            />
          </>
        );
      },
    },
    {
      label: "추천3 - 장바구니",
      value: "recommend-3",
      component: function () {
        return (
          <>
            <span>
              최근 업데이트 :{" "}
              {daysFromToday(dataSimilar?.latest_updated_date || "")}일 전
            </span>
            <AlgorithmSimilarTable
              data={dataSimilar?.results ?? []}
              loading={isLoadingUser || isFetchingUser}
            />
            <PaginationControls
              page={filters.page || 1}
              setPage={handleChangePage}
              totalPages={calculatePageCount(
                dataSimilar?.total_count || 0,
                filters.count_per_page || 8
              )}
            />
          </>
        );
      },
    },
  ];

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="알고리즘 추천구좌 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4">
            {tabs.map((item, index) => (
              <Button
                key={`tab-${index}`}
                variant={tab == item.value ? "default" : "outline"}
                onClick={() => {
                  route.push(
                    `/exposure-accounts/algorithm-recommend?tab=${item.value}`
                  );
                  handleOnReset();
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-4 justify-between">
            {renderSearch()}
            {tab !== "recommend-section" && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleDownload}>
                  양식 다운로드
                </Button>
                <Button variant="outline" onClick={handleClickUpload}>
                  CSV 파일 업로드
                </Button>
              </div>
            )}
          </div>
          {tabs.map((item, index) => (
            <Fragment key={`tab-${index}`}>
              {tab == item.value ? <item.component /> : <></>}
            </Fragment>
          ))}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <FullPageLoader
          isLoading={
            isLoading ||
            isLoadingUser ||
            isFetchingUser ||
            isLoadingSetTopic ||
            isFetchingSetTopic ||
            isLoadingSimilar ||
            isFetchingSimilar
          }
        />
      </SidebarInset>
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
