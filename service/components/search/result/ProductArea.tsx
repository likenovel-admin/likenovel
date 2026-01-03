import ProductListCard from "@/components/common/ProductListCard";
import Tab from "@/components/common/Tab";
import { IProduct } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  data: IProduct[];
  keyword?: string;
}
const ProductArea = ({ data, keyword = "" }: Props) => {
  const [activeTab, setActiveTab] = useState("update");
  const router = useRouter();
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(
      `/product/search/result/normal?keyword=${keyword}&orderby=${value}`
    );
  };
  return (
    <div className="flex flex-col w-full gap-14pxr">
      {data.length > 0 && (
      <>
        <span className="text-24pxr font-bold">검색결과</span>
        <Tab
            tabs={[
              { label: "최근 업데이트 순", value: "update" },
              { label: "조회 순", value: "view" },
            ]}
            style="check"
            activeTab={activeTab}
            onTabChange={handleTabChange} />
      </>
      )}
      <div className="flex flex-col md:gap-14pxr">
        {data && data?.map((product) => (
          <ProductListCard
            key={product.productId}
            data={product as unknown as IProduct}
            hasInterestBadge
          />
        ))}
      </div>
    </div>
  );
};
export default ProductArea;
