import { ISectionData } from "@/app/api/query/product/dto";
import useMediaDevice from "@/hooks/useMediaDevice";
import { IProduct } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CircleArrow from "../common/CircleArrow";
import ErrorArea from "../common/ErrorArea";
import MainHeader from "../common/MainHeader";
import ProductCoverCard from "../common/ProductCoverCard";

interface Props {
  suggestionData?: ISectionData | null;
  productType?: "suggest" | "interest";
}
const BottomProducts = ({ suggestionData, productType = "suggest" }: Props) => {
  const router = useRouter();
  const device = useMediaDevice();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 7;

  if (!suggestionData || !suggestionData.products.length) {
    return <ErrorArea />;
  }

  // Old logic: Pagination-based (move entire page)
  // const currentProducts =
  //   device === "mobile" || device === "tablet"
  //     ? suggestionData.products
  //     : suggestionData.products.slice(
  //         currentPage * itemsPerPage,
  //         (currentPage + 1) * itemsPerPage
  //       );

  // New logic: Index-based scrolling (move one item at a time)
  const currentProducts =
    device === "mobile" || device === "tablet"
      ? suggestionData.products
      : suggestionData.products.slice(
          // currentPage * itemsPerPage,
          // (currentPage + 1) * itemsPerPage
          currentPage,
          currentPage + itemsPerPage
        );

  const totalItems = suggestionData.products.length;

  // Old logic: Calculate total pages
  // const lastPage = Math.ceil(totalItems / itemsPerPage) - 1;

  // New logic: Calculate max index
  const lastPage = Math.max(0, totalItems - itemsPerPage);

  const handleNextPage = () => {
    // Old logic: Move to next page
    // if ((currentPage + 1) * itemsPerPage < suggestionData.products.length) {
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
    <div className="relative max-w-[1120px] md:h-[350px]">
      <MainHeader
        headerText={
          productType === "suggest"
            ? suggestionData.suggestTitle
            : "관심 끊기기 임박"
        }
        hasMoreButton={productType === "interest"}
        moreButtonOnClick={() => {
          router.push("/product/preference/interest-drop");
        }}
      />
      <div className="flex gap-10pxr md:gap-20pxr mt-10pxr md:mt-20pxr scroll-hidden overflow-x-auto lg:overflow-hidden pl-16pxr md:pl-0">
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
export default BottomProducts;
