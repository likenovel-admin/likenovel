import { useSelectPaidAllProducts } from "@/app/api/query/product";
import { useGenre } from "@/contexts/GenreContext";
import useAuthStore from "@/store/authStore";
import useBottomSheetStore from "@/store/bottomSheetStore";
import useModalStore from "@/store/modalStore";
import { IProduct } from "@/types";
import { useEffect } from "react";
import BottomSheet from "../common/BottomSheet";
import Button from "../common/Button";
import Modal from "../common/Modal";
import ProductListCard from "../common/ProductListCard";
import SimpleSpinner from "../common/SimpleSpinner";
import GenreSelectModal from "../modal/GenreSelectModal";
import Close from "/public/images/close.svg";
import Filter from "/public/images/filter.svg";
interface Props {
  stateType: "ongoing" | "end";
}
const ProductArea = ({ stateType }: Props) => {
  const { setModal } = useModalStore();
  const { setBottomSheet } = useBottomSheetStore();
  const { selectedGenres, removeGenre } = useGenre();
  const { user } = useAuthStore();

  const adultYn = user?.isOnAdult ? "Y" : "N";

  const {
    data: selectedAllProducts,
    isLoading,
    refetch,
  } = useSelectPaidAllProducts(
    stateType,
    selectedGenres.includes("전체") ? [] : selectedGenres,
    1,
    undefined,
    adultYn
  ); //무한스크롤 추가 필요

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModal(<GenreSelectModal />);
  };
  const handleOpenBottomSheet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBottomSheet(<GenreSelectModal />);
  };

  useEffect(() => {
    if (selectedGenres.length > 0) {
      refetch();
    }
  }, [selectedGenres]);

  useEffect(() => {
    refetch();
  }, [user?.isOnAdult]);

  return (
    <div className="flex flex-col">
      <div className="flex justify-between mt-24pxr">
        <div className="flex items-center">
          <span className="flex flex-shrink-0 text-14pxr font-semibold pl-16pxr">
            {stateType === "ongoing" ? "최근 업데이트 순" : "최근 완결 순"}
          </span>
          <div className="flex flex-wrap gap-5pxr ml-16pxr">
            {selectedGenres.length > 0 &&
              selectedGenres.map((genre, index) => (
                <>
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
                  <button
                    className="md:hidden flex items-center min-w-[30px] px-10pxr h-[30px] border border-dark-gray-100 rounded-[20px]"
                    onClick={() => {
                      // TODO: 남은 장르로 재검색
                      removeGenre(genre);
                    }}
                    key={index}
                  >
                    <span className="text-12pxr text-dark-gray-500 mr-10pxr">
                      {genre}
                    </span>
                    <Close className="w-[8px] h-[8px] text-light-gray-600" />
                  </button>
                </>
              ))}
          </div>
        </div>
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
        <button
          className="flex justify-center items-center md:hidden border border-light-gray-600 rounded-full min-w-[30px] h-[30px] mr-16pxr md:mr-0"
          onClick={handleOpenBottomSheet}
        >
          <Filter />
        </button>
      </div>
      <div className="md:hidden w-[93%] ml-[16px] mt-10pxr border border-t-light-gray-400 border-b-0 border-l-0 border-r-0" />
      <div className="flex flex-col md:gap-14pxr md:mt-15pxr">
        {isLoading ? (
          <div>
            <SimpleSpinner />
          </div>
        ) : selectedAllProducts?.data?.length ? (
          selectedAllProducts?.data.map((product) => (
            <ProductListCard
              key={product.productId}
              data={product as unknown as IProduct}
              hasInterestBadge
              hasPromotionBadge
            />
          ))
        ) : (
          <div className="flex justify-center items-center h-[200px] text-dark-gray-500">
            검색된 작품이 없습니다
          </div>
        )}
      </div>
      <Modal size="sm" />
      <BottomSheet />
    </div>
  );
};
export default ProductArea;
