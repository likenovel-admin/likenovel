import { buildPageMetadata } from "@/utils/siteSeoMetadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "무료연재 TOP50",
  description:
    "지금 독자들이 가장 많이 읽는 웹소설 TOP50. 다음에 읽을 작품을 실시간 랭킹에서 확인해보세요.",
  path: "/product/top50/free-top",
});

export default function FreeTopLayout({ children }: { children: ReactNode }) {
  return children;
}
