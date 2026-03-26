"use client";

import {
  TTop50Area,
  useSelectTop50Products,
} from "@/app/api/query/top50";
import Spinner from "@/components/common/Spinner";
import Tab from "@/components/common/Tab";
import ProductArea from "@/components/top50/ProductArea";
import useAuthStore from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

const TOP50_TABS: Array<{ label: string; value: TTop50Area; href: string }> = [
  {
    label: "무료연재 TOP50",
    value: "freeSerialTop",
    href: "/product/top50/free-top",
  },
  {
    label: "유료연재 TOP50",
    value: "paidSerialTop",
    href: "/product/top50/paid-top",
  },
  {
    label: "연재완결 TOP50",
    value: "paidEndTop",
    href: "/product/top50/end-top",
  },
  {
    label: "단행본 TOP50",
    value: "paidStandaloneTop",
    href: "/product/top50/standalone-top",
  },
];

interface Props {
  initialArea: TTop50Area;
}

export default function Top50Page({ initialArea }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data, isPending, refetch } = useSelectTop50Products(initialArea);

  const products = useMemo(() => {
    return data?.data.filter((item) => item.area === initialArea) ?? [];
  }, [data, initialArea]);

  useEffect(() => {
    refetch();
  }, [isAuthenticated, refetch]);

  return (
    <div className="w-full max-w-[1120px] mx-auto">
      <div className="pl-16pxr md:pl-0">
        <Tab
          tabs={TOP50_TABS.map((item) => ({
            label: item.label,
            value: item.value,
          }))}
          style="black"
          activeTab={initialArea}
          onTabChange={(value) => {
            const nextTab = TOP50_TABS.find((item) => item.value === value);
            if (nextTab && nextTab.href) {
              router.push(nextTab.href);
            }
          }}
        />
      </div>
      {isPending ? (
        <div className="h-screen flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <ProductArea
          data={products}
          pageType={initialArea === "freeSerialTop" ? "free" : "paid"}
        />
      )}
    </div>
  );
}
