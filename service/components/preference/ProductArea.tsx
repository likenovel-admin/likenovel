import {
  useAllBookmarkDelete,
  useSelectBookmarks,
} from "@/app/api/query/bookmark";
import {
  useDeleteAllRecentProduct,
  useSelectInterestDropProducts,
} from "@/app/api/query/product";
import useAuthStore from "@/store/authStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { IProduct } from "@/types";
import { getDiffEndDate } from "@/utils/getLatestEpisodeDate";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import Modal from "../common/Modal";
import Tab from "../common/Tab";
import WarningModal from "../modal/WarningModal";
import ProductListCard from "./ProductListCard";
import Trash from "/public/images/trash.svg";

interface Props {
  products?: IProduct[];
  pageType: "preference" | "interestDrop" | "lastViewed";
  hasGle?: boolean;
}
const ProductArea = ({ products, pageType, hasGle = true }: Props) => {
  // TODO: 작품 조회 api 각각 호출 (선호작, 관심끊기기, 최근 본 작품)
  const { user, isAuthenticated, accessToken } = useAuthStore();
  const cacheIdentity =
    String(user?.userId || "") || accessToken || (isAuthenticated ? "auth" : "guest");
  const isPreferencePage = pageType === "preference";
  const isInterestDropPage = pageType === "interestDrop";
  const { data: selectedBookmarks, isLoading, refetch } = useSelectBookmarks(
    isPreferencePage
  );
  const { data: interestDropProducts } = useSelectInterestDropProducts(
    isInterestDropPage,
    cacheIdentity
  );
  const interestDropData: any = useMemo(() => {
    return interestDropProducts ? interestDropProducts.data : [];
  }, [interestDropProducts]);
  const { setModal, closeModal } = useModalStore();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const { mutateAsync: deleteAllBookmark } = useAllBookmarkDelete();
  const { mutateAsync: deleteAllRecentProduct, isPending: isDeletingAll } =
    useDeleteAllRecentProduct();
  const [preferenceActiveTab, setPreferenceActiveTab] = useState("update");
  const [interestDropActiveTab, setInterestDropActiveTab] = useState("soon");
  const handlePreferenceTabChange = (value: string) => {
    setPreferenceActiveTab(value);
  };
  const handleInterestDropTabChange = (value: string) => {
    setInterestDropActiveTab(value);
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const handleConfirm = async () => {
      if (pageType === "preference") {
        try {
          await deleteAllBookmark();
          refetch();
          setToast({
            message: "모든 선호작이 삭제되었습니다.",
            type: "success",
          });
        } catch (error) {
          setToast({
            message: "선호작 삭제에 실패했습니다.",
            type: "error",
          });
        }
      } else if (pageType === "lastViewed") {
        // Old logic: Use localStorage only
        // localStorage.setItem("recent_viewed_products", "[]");
        // setToast({
        //   message: "최근 본 작품의 전체 리스트가 초기화 되었습니다.",
        //   type: "success",
        // });
        // window.location.reload();

        // New logic: Use API and invalidate query
        if (isDeletingAll) return; // Prevent multiple clicks using React Query state
        try {
          await deleteAllRecentProduct();
          queryClient.invalidateQueries({ queryKey: ["getRecentProduct"] });
          setToast({
            message: "최근 본 작품의 전체 리스트가 초기화 되었습니다.",
            type: "success",
          });
        } catch (error) {
          setToast({
            message: "삭제에 실패했습니다.",
            type: "error",
          });
        }
      }
    };
    setModal(
      <WarningModal
        content={
          <span className="text-17pxr font-bold">
            전체 {pageType === "preference" ? "선호작" : "최근 본 작품"}을 삭제
            하시겠습니까?
          </span>
        }
        onConfirm={handleConfirm}
      />
    );
  };

  const data: any = useMemo(() => {
    return products
      ? products
      : pageType === "interestDrop"
      ? interestDropData
      : selectedBookmarks ?? [];
  }, [products, pageType, interestDropData, selectedBookmarks]);

  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }

    // Add filtering and sorting logic for interest drop page
    if (pageType === "interestDrop") {
      if (interestDropActiveTab === "soon") {
        // Filter products with interest_ending_soon status
        const filteredData = data.filter(
          (product) => product.interestStatus === "interest_ending_soon"
        );
        // Sort by D-day (closest to ending first)
        // D-day calculation: D-(interestEndDate - now)
        return filteredData.sort((a, b) => {
          const now = new Date().getTime();
          const endDateA = a.badge?.interestEndDate
            ? new Date(a.badge.interestEndDate).getTime()
            : Infinity;
          const endDateB = b.badge?.interestEndDate
            ? new Date(b.badge.interestEndDate).getTime()
            : Infinity;

          // Calculate remaining days: (endDate - now) / (1000 * 60 * 60 * 24)
          const daysRemainingA = getDiffEndDate(a.badge?.interestEndDate);
          const daysRemainingB = getDiffEndDate(b.badge?.interestEndDate);
          // Sort by ascending days remaining (D-1 comes before D-7)
          return daysRemainingA - daysRemainingB;
        });
      } else if (interestDropActiveTab === "already") {
        // Filter products that are NOT interest_ending_soon (already lost interest or no interest)
        const filteredData = data.filter(
          (product) => product.interestStatus === "no_interest"
        );
        // Sort by works that have lost interest (latest order - most recently lost interest first)
        return filteredData.sort((a, b) => {
          const endDateA = a.badge?.interestEndDate
            ? new Date(a.badge.interestEndDate).getTime()
            : 0;
          const endDateB = b.badge?.interestEndDate
            ? new Date(b.badge.interestEndDate).getTime()
            : 0;
          return endDateB - endDateA;
        });
      }
    }

    // Original sorting logic for other pageTypes
    if (preferenceActiveTab === "update") {
      return [...data].sort((a, b) => {
        const dateA = new Date(a.latestEpisodeDate || 0).getTime();
        const dateB = new Date(b.latestEpisodeDate || 0).getTime();
        return dateB - dateA;
      });
    } else if (preferenceActiveTab === "alphabetical") {
      return [...data].sort((a, b) => a.title.localeCompare(b.title));
    } else if (preferenceActiveTab === "preference") {
      // Sort by bookmark registration date (most recent first)
      return [...data].sort((a, b) => {
        const dateA = new Date(a.bookmarkCreatedDate || 0).getTime();
        const dateB = new Date(b.bookmarkCreatedDate || 0).getTime();
        return dateB - dateA;
      });
    }
    return data;
  }, [preferenceActiveTab, interestDropActiveTab, pageType, data]);

  return (
    <div className="w-full max-w-[1120px] mx-auto flex flex-col px-16pxr md:px-0">
      <div className="flex flex-col mt-40pxr gap-16pxr">
        <div className="flex justify-between">
          <span className="text-17pxr md:text-24pxr font-bold">
            {pageType === "preference"
              ? `선호작`
              : pageType === "interestDrop"
              ? "관심 끊기기 임박"
              : "최근 본 작품"}
          </span>
          {pageType === "lastViewed" && (
            <>
              <button
                disabled={sortedData.length === 0}
                className="hidden md:flex items-center gap-5pxr text-14pxr text-dark-gray-300 hover:text-dark-gray-600 transition-colors disabled:opacity-50 disabled:hover:text-dark-gray-300"
                onClick={handleOpenModal}
              >
                <Trash />
                전체삭제
              </button>
              <button
                disabled={sortedData.length === 0}
                className="md:hidden flex items-center gap-5pxr text-14pxr text-dark-gray-300 hover:text-dark-gray-600 transition-colors disabled:opacity-50 disabled:hover:text-dark-gray-300"
                onClick={handleOpenModal}
              >
                전체 <Trash />
              </button>
            </>
          )}
        </div>
        {pageType === "preference" ? (
          <div className="flex justify-between">
            <Tab
              style="check"
              tabs={[
                { label: "최근 업데이트 순", value: "update" },
                { label: "가나다 순", value: "alphabetical" },
                { label: "선호작 등록 순", value: "preference" },
              ]}
              activeTab={preferenceActiveTab}
              onTabChange={handlePreferenceTabChange}
            />
            <button
              disabled={sortedData.length === 0}
              className="hidden md:flex items-center gap-5pxr text-14pxr text-dark-gray-300 hover:text-dark-gray-600 transition-colors disabled:opacity-50 disabled:hover:text-dark-gray-300"
              onClick={handleOpenModal}
            >
              <Trash />
              전체삭제
            </button>
            <button
              disabled={sortedData.length === 0}
              className="md:hidden flex items-center gap-5pxr text-14pxr text-dark-gray-300 hover:text-dark-gray-600 transition-colors disabled:opacity-50 disabled:hover:text-dark-gray-300"
              onClick={handleOpenModal}
            >
              전체 <Trash />
            </button>
          </div>
        ) : pageType === "interestDrop" ? (
          <Tab
            style="check"
            tabs={[
              { label: "관심 끊기기 임박 순", value: "soon" },
              { label: "관심 끊긴 순", value: "already" },
            ]}
            activeTab={interestDropActiveTab}
            onTabChange={handleInterestDropTabChange}
          />
        ) : (
          ""
        )}
        <div className="w-full border border-t-light-gray-500 border-b-0 border-l-0 border-r-0" />
        {sortedData.length === 0 ? (
          <span className="flex justify-center mt-10pxr text-dark-gray-400">
            {pageType === "preference"
              ? "선호작"
              : pageType === "interestDrop"
              ? "관심 끊기기 임박 작품"
              : "최근 본 작품"}
            이 없습니다.
          </span>
        ) : (
          <>
            {sortedData.length > 0 &&
              sortedData.map((product: IProduct) => (
                <div key={product.productId}>
                  <ProductListCard
                    pageType={pageType}
                    data={product as unknown as IProduct}
                    hasGle={hasGle}
                  />
                  <div className="w-full border border-t-light-gray-200 border-b-0 border-l-0 border-r-0" />
                </div>
              ))}
          </>
        )}
      </div>
      <Modal size="sm" />
    </div>
  );
};
export default ProductArea;
