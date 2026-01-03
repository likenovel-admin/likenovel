import AnalysisDataTable from "@/app/discover-products/chart/components/analysis-data-table";
import { SimilarProduct } from "@/types/product-discovery-statistics";
import React, { useMemo } from "react";

export default function RecommendSimilarWorks({
  data,
}: {
  data: {
    similar_product_3: SimilarProduct | null;
    similar_product_2: SimilarProduct | null;
    similar_product_1: SimilarProduct | null;
  };
}) {
  const formatData = useMemo(() => {
    const result = [];
    if (data.similar_product_1) {
      result.push({
        no: 1,
        item: data.similar_product_1.title,
        link: `${process.env.NEXT_PUBLIC_USER_SITE_URL}/product/${data.similar_product_1.product_id}`,
        linkName: "링크",
      });
    }
    if (data.similar_product_2) {
      result.push({
        no: 2,
        item: data.similar_product_2.title,
        link: `${process.env.NEXT_PUBLIC_USER_SITE_URL}/product/${data.similar_product_2.product_id}`,
        linkName: "링크",
      });
    }
    if (data.similar_product_3) {
      result.push({
        no: 3,
        item: data.similar_product_3.title,
        link: `/products/details?id=${data.similar_product_3.product_id}`,
        linkName: "링크",
      });
    }
    return result;
  }, [data]);
  return (
    <>
      <div className="flex flex-col space-y-1.5 p-6">
        <div className="font-semibold leading-none tracking-tight">
          유사작 추천
        </div>
      </div>
      <div className="p-6 pt-0">
        <AnalysisDataTable data={formatData} />
      </div>
    </>
  );
}
