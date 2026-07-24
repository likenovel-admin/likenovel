import { buildPageMetadata } from "@/utils/siteSeoMetadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "유료연재 TOP50",
  description: "라이크노벨 유료연재 인기 작품 TOP50을 확인해 보세요.",
  path: "/product/top50/paid-top",
});

export default function PaidTopLayout({ children }: { children: ReactNode }) {
  return children;
}
