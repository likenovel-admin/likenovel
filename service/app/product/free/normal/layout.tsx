import { buildPageMetadata } from "@/utils/siteSeoMetadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "무료 일반연재",
  description: "라이크노벨의 무료 일반연재 웹소설을 만나보세요.",
  path: "/product/free/normal",
});

export default function FreeNormalLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
