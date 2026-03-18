import { useSelectBookmarks } from "@/app/api/query/bookmark";
import {
  useDeleteAllRecentProduct,
  useDeleteRecentProduct,
} from "@/app/api/query/product";
import BookmarkButton from "@/components/common/BookmarkButton";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { IProduct } from "@/types";
import {
  buildProductDetailPath,
  ProductDetailEntrySource,
  setPendingProductDetailEntrySource,
} from "@/utils/productPath";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Delete from "/public/images/delete.svg";

interface Props {
  products: IProduct[];
  onProductsChange?: (products: IProduct[]) => void;
  isAuthenticated?: boolean;
  entrySource?: ProductDetailEntrySource;
}

const RecentlyViewedProductModal = ({
  products,
  onProductsChange,
  isAuthenticated = false,
  entrySource,
}: Props) => {
  const router = useRouter();
  const { closeModal } = useModalStore();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const { data: bookmarks } = useSelectBookmarks();
  const [currentProducts, setCurrentProducts] = useState<IProduct[]>(products);

  // API mutations for authenticated users
  const { mutateAsync: deleteRecentProduct, isPending: isDeletingOne } =
    useDeleteRecentProduct();
  const { mutateAsync: deleteAllRecentProduct, isPending: isDeletingAll } =
    useDeleteAllRecentProduct();

  const bookmarkedProductIds = useMemo(() => {
    return new Set(bookmarks?.map((bookmark: any) => bookmark.productId) || []);
  }, [bookmarks]);

  const handleClearAll = async () => {
    if (isDeletingAll) return; // Prevent multiple clicks using React Query state

    if (isAuthenticated) {
      // Use API for authenticated users
      try {
        await deleteAllRecentProduct();
        setCurrentProducts([]);
        onProductsChange?.([]);
        queryClient.invalidateQueries({ queryKey: ["getRecentProduct"] });
        setToast({
          message: "최근 본 작품이 모두 삭제되었습니다.",
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

  const handleRemoveProduct = async (productId: number) => {
    if (isDeletingOne) return; // Prevent multiple clicks using React Query state

    if (isAuthenticated) {
      // Use API for authenticated users
      try {
        await deleteRecentProduct(productId);
        const updatedProducts = currentProducts.filter(
          (item: IProduct) => item.productId !== productId
        );
        setCurrentProducts(updatedProducts);
        onProductsChange?.(updatedProducts);
        queryClient.invalidateQueries({ queryKey: ["getRecentProduct"] });
        setToast({
          message: "작품이 삭제되었습니다.",
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
  const navigateToProductDetail = (productId: number) => {
    if (entrySource) {
      setPendingProductDetailEntrySource(productId, entrySource);
    }
    closeModal();
    router.push(buildProductDetailPath(productId));
  };

  return (
    <div className="px-6">
      <div className="flex justify-between items-center mt-[15px] mb-[13px]">
        <h1 className="font-bold text-22pxr">최근 본 작품 </h1>
        <button className="flex items-center gap-5pxr" onClick={handleClearAll}>
          <Delete />
          <span className="text-[#6B6E76] font-normal text-14pxr tracking-[-2%]">
            전체삭제
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-10pxr">
        {currentProducts.length === 0 ? (
          <div className="text-center py-40pxr text-[#6B6E76]">
            최근 본 작품이 없습니다.
          </div>
        ) : (
          currentProducts.map((product) => (
            <div
              key={product.productId}
              className="relative flex items-start gap-4 p-17pxr bg-white rounded-[10px] border border-[#EDEFF3] cursor-pointer"
              onClick={() => {
                navigateToProductDetail(product.productId);
              }}
            >
              <div className="relative rounded-[8px] flex-shrink-0">
                <div className="w-[70px] h-[98px] rounded-[8px] overflow-hidden">
                  {(product.image && product?.image?.coverImagePath) ||
                  product?.coverImagePath ? (
                    <Image
                      src={
                        product?.image?.coverImagePath ||
                        product?.coverImagePath ||
                        "https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
                      }
                      alt={product.title}
                      width={70}
                      height={98}
                      className="w-full h-full rounded-[8px] object-cover"
                    />
                  ) : (
                    <Image
                      src="https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
                      alt={product.title}
                      width={70}
                      height={98}
                      className="w-full h-full rounded-[8px] object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center h-[100px]">
                <div>
                  <p className="font-semibold text-17pxr text-[#111317] mb-10pxr line-clamp-2 leading-[22px] tracking-[-2%]">
                    {product.title}
                  </p>
                  <p className="text-13pxr font-normal text-[#6B6E76] tracking-[-2%]">
                    {product.authorNickname || product.authorName || ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="text-18pxr text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveProduct(product.productId);
                  }}
                >
                  <Delete />
                </button>
              </div>
              <div className="absolute right-[17px] bottom-[17px] flex items-center justify-between gap-15pxr">
                <BookmarkButton
                  productId={product.productId}
                  bookmarkYn={
                    bookmarkedProductIds.has(product.productId) ? "Y" : "N"
                  }
                  buttonStyle="flex items-center justify-center border rounded-full w-[34px] h-[34px] border-[#D8DCE6]"
                  bookmarkStyle="w-[16px] h-[19px] text-dark-gray-500 hover:text-dark-gray-600"
                  activeBookmarkStyle="w-[16px] h-[19px]"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
export default RecentlyViewedProductModal;
