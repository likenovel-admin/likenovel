import { buildPageMetadata } from "@/utils/siteSeoMetadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "무료 일반연재",
  description:
    "매일 새 회차가 올라오는 무료 연재 웹소설. 오늘 시작하기 좋은 작품을 만나보세요.",
  path: "/product/free/normal",
});

export default function FreeNormalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
