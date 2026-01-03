import { useSelectFreeAllProducts } from "@/app/api/query/product";
import { useGenre } from "@/contexts/GenreContext";
import useAuthStore from "@/store/authStore";
import useBottomSheetStore from "@/store/bottomSheetStore";
import useModalStore from "@/store/modalStore";
import { IProduct } from "@/types";
import { getLocalStorage, STORAGE_KEYS } from "@/utils/localStorage";
import { useEffect, useState } from "react";
import BottomSheet from "../common/BottomSheet";
import BoxProductList from "../common/BoxProductList";
import Button from "../common/Button";
import ListTypeTab from "../common/ListTypeTab";
import MainHeader from "../common/MainHeader";
import Modal from "../common/Modal";
import ProductListCard from "../common/ProductListCard";
import SimpleSpinner from "../common/SimpleSpinner";
import GenreSelectModal from "../modal/GenreSelectModal";
import Close from "/public/images/close.svg";
import Filter from "/public/images/filter.svg";
interface Props {
  pageType: "normal" | "free";
}
const ProductArea = ({ pageType = "normal" }: Props) => {
  const { setModal } = useModalStore();
  const { setBottomSheet } = useBottomSheetStore();
  const { selectedGenres, removeGenre } = useGenre();
  const { user } = useAuthStore();

  const adultYn = user?.isOnAdult ? "Y" : "N";

  const {
    data: selectedAllProducts,
    isLoading,
    refetch,
  } = useSelectFreeAllProducts(
    pageType,
    selectedGenres.includes("전체") ? [] : selectedGenres,
    1,
    27,
    adultYn
  );

  const [listType, setListType] = useState<"list" | "box">(() => {
    return (getLocalStorage<"list" | "box">(STORAGE_KEYS.FREE_TOP_VIEW_TYPE) ||
      "list") as "list" | "box";
  });

  // Refetch when isOnAdult changes
  useEffect(() => {
    refetch();
  }, [user?.isOnAdult]);
  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModal(<GenreSelectModal />);
  };
  const handleOpenBottomSheet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBottomSheet(<GenreSelectModal />);
  };

  return (
    <div className="flex flex-col mt-30pxr">
      <div className="flex justify-between">
        <MainHeader
          headerText={pageType === "normal" ? "일반 무료작품" : "자유 무료작품"}
        />
        <div className="flex gap-10pxr">
          <button
            className="flex justify-center items-center md:hidden border border-light-gray-600 rounded-full min-w-[30px] h-[30px]"
            onClick={handleOpenBottomSheet}
          >
            <Filter />
          </button>
          <ListTypeTab listType={listType} setListType={setListType} isFree />
        </div>
      </div>
      <div className="hidden md:block w-full border border-t-light-gray-500 border-b-0 border-l-0 border-r-0 md:mt-20pxr" />
      <div className="flex items-center gap-14pxr md:mt-20pxr md:mb-20pxr">
        <Button
          variant="secondary"
          size="sm"
          className="hidden md:flex w-[105px]"
          onClick={handleOpenModal}
        >
          <Filter />
          <span className="ml-5pxr text-14pxr text-dark-gray-500">
            장르 필터
          </span>
        </Button>
        {selectedGenres.length > 0 && (
          <div className="hidden md:block h-[14px] border border-l-light-gray-500 border-b-0 border-t-0 border-r-0" />
        )}
        {selectedGenres.length > 0 &&
          selectedGenres.map((genre) => (
            <Button
              variant="secondary"
              size="sm"
              className="hidden md:flex min-w-[70px] px-14pxr"
              onClick={() => {
                // TODO: 남은 장르로 재검색
                removeGenre(genre);
              }}
              key={genre}
            >
              <span className="text-14pxr text-dark-gray-500 mr-15pxr">
                {genre}
              </span>
              <Close className="w-[8px] h-[8px] text-light-gray-600" />
            </Button>
          ))}
      </div>
      <div className="md:hidden w-[93%] ml-[16px] my-10pxr border border-t-light-gray-400 border-b-0 border-l-0 border-r-0" />
      <div className="flex gap-5pxr ml-16pxr">
        {selectedGenres.length > 0 &&
          selectedGenres.map((genre) => (
            <button
              className="md:hidden flex items-center min-w-[30px] px-10pxr h-[30px] border border-dark-gray-100 rounded-[20px]"
              onClick={() => {
                // TODO: 남은 장르로 재검색
                removeGenre(genre);
              }}
              key={genre}
            >
              <span className="text-12pxr text-dark-gray-500 mr-10pxr">
                {genre}
              </span>
              <Close className="w-[8px] h-[8px] text-light-gray-600" />
            </button>
          ))}
      </div>
      {listType === "list" ? (
        <div className="flex flex-col md:gap-14pxr">
          {isLoading ? (
            <div>
              <SimpleSpinner />
            </div>
          ) : selectedAllProducts?.data?.length ? (
            selectedAllProducts.data.map((product) => (
              <ProductListCard
                key={product.productId}
                data={product as unknown as IProduct}
                hasInterestBadge
              />
            ))
          ) : (
            <div className="flex justify-center items-center h-[200px] text-dark-gray-500">
              검색된 작품이 없습니다
            </div>
          )}
        </div>
      ) : (
        <BoxProductList
          data={
            isLoading
              ? []
              : (selectedAllProducts?.data as unknown as IProduct[])
          }
          pageType={"free"}
        />
      )}
      <Modal size="sm" />
      <BottomSheet />
    </div>
  );
};
export default ProductArea;
