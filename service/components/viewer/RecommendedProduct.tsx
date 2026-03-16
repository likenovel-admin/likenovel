import { useSelectSuggestProducts } from "@/app/api/query/suggest";
import useMediaDevice from "@/hooks/useMediaDevice";
import useAuthStore from "@/store/authStore";
import { IProduct } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CircleArrow from "../common/CircleArrow";
import MainHeader from "../common/MainHeader";
import ProductCoverCard from "../common/ProductCoverCard";

interface Props {
  productId: number;
  productType?: "suggest" | "interest";
}
const RecommendedProduct = ({ productId, productType = "suggest" }: Props) => {
  const router = useRouter();
  const device = useMediaDevice();
  const { user, isAuthenticated, accessToken } = useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
  }));
  const canUseUserScope = !!accessToken && !!user?.userId && isAuthenticated;
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;

  const { data: suggestData } = useSelectSuggestProducts(
    productId,
    "cart",
    canUseUserScope
  );

  if (!suggestData?.data || !suggestData.data.length) {
    return null;
  }

  // Old logic: Pagination-based (move entire page)
  // const currentProducts =
  //   device === "mobile" || device === "tablet"
  //     ? suggestData.data
  //     : suggestData.data.slice(
  //         currentPage * itemsPerPage,
  //         (currentPage + 1) * itemsPerPage
  //       );

  // New logic: Index-based scrolling (move one item at a time)
  const currentProducts =
    device === "mobile" || device === "tablet"
      ? suggestData.data
      : suggestData.data.slice(
          // currentPage * itemsPerPage,
          // (currentPage + 1) * itemsPerPage
          currentPage,
          currentPage + itemsPerPage
        );

  const totalItems = suggestData.data.length;

  // Old logic: Calculate total pages
  // const lastPage = Math.ceil(totalItems / itemsPerPage) - 1;

  // New logic: Calculate max index
  const lastPage = Math.max(0, totalItems - itemsPerPage);

  const handleNextPage = () => {
    // Old logic: Move to next page
    // if ((currentPage + 1) * itemsPerPage < suggestData.data.length) {
    //   setCurrentPage(currentPage + 1);
    // }

    // New logic: Move one item forward
    if (currentPage < lastPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    // New logic remains same as old
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };
  return (
    <div className="mt-[36px] relative max-w-full md:h-[350px]">
      <MainHeader
        headerText="추천작품"
        hasMoreButton={productType === "interest"}
        moreButtonOnClick={() => {
          router.push("/product/preference/interest-drop");
        }}
      />
      <div className="flex gap-10pxr md:gap-20pxr mt-10pxr md:mt-20pxr scroll-hidden overflow-x-auto lg:overflow-hidden">
        {currentProducts.map((product) => (
          <ProductCoverCard
            key={product.productId}
            data={product as unknown as IProduct}
          />
        ))}
      </div>
      <div className="absolute top-[43%] left-[-20px] z-5 hidden lg:block">
        <CircleArrow
          direction="left"
          onClick={handlePrevPage}
          isDisabled={currentPage === 0}
        />
      </div>
      <div className="absolute top-[43%] right-[-20px] z-5 hidden lg:block">
        <CircleArrow
          direction="right"
          onClick={handleNextPage}
          isDisabled={currentPage === lastPage}
        />
      </div>
    </div>
  );
};
export default RecommendedProduct;
