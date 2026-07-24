import { buildPageMetadata } from "@/utils/siteSeoMetadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "유료연재",
  description: "라이크노벨의 유료연재 웹소설을 만나보세요.",
  path: "/product/paid",
});

export default function PaidLayout({ children }: { children: ReactNode }) {
  return children;
}
