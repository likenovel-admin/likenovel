import { useGetMyProducts } from "@/app/api/query/author/product";
import { useMemo, useState } from "react";
import ProductListCard from "../common/ProductListCard";
import Tab from "../common/Tab";

const ProductArea = () => {
  const [activeTab, setActiveTab] = useState("update");
  const { data: productsData, isLoading, error, refetch } = useGetMyProducts();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  const sortedData = useMemo(() => {
    if (!productsData?.data) return [];

    const products = productsData.data?.products || [];

    if (activeTab === "update") {
      return [...products].sort((a, b) => {
        const dateA = new Date(a.properties?.latestEpisodeDate || a.createdDate || 0).getTime();
        const dateB = new Date(b.properties?.latestEpisodeDate || b.createdDate || 0).getTime();
        return dateB - dateA;
      });
    } else if (activeTab === "alphabetical") {
      return [...products].sort((a, b) => a.title.localeCompare(b.title));
    }
    return products;
  }, [activeTab, productsData]);

  return (
    <div className="flex flex-col mt-30pxr">
      <div className="pl-16pxr md:pl-0">
        <span className="text-17pxr md:text-18pxr font-semibold">
          {sortedData.length}개
        </span>
        <span className="text-17pxr md:text-18pxr">의 작품</span>
      </div>
      <div className="mt-16pxr mb-12pxr pl-16pxr md:pl-0">
        <Tab
          style="check"
          tabs={[
            { label: "최근 업데이트 순", value: "update" },
            { label: "가나다 순", value: "alphabetical" },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
      <div className="flex flex-col gap-10pxr">
        {sortedData.map((product) => (
          <ProductListCard
            key={product.productId}
            data={product}
            isAuthorPage
            hasPromotionBadge
            refetch={() => {
              refetch();
            }}
          />
        ))}
      </div>
    </div>
  );
};
export default ProductArea;
