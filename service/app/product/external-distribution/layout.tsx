import { buildPageMetadata } from "@/utils/siteSeoMetadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "카카오페이지·리디에서도 연재되는 작품",
  description:
    "라이크노벨에서 유료 연재한 작품 중 카카오페이지와 리디에서도 연재되는 작품을 모아봤어요.",
  path: "/product/external-distribution",
});

export default function ExternalDistributionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
