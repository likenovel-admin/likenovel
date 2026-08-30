import { buildPageMetadata } from "@/utils/siteSeoMetadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "유료연재",
  description:
    "몰입을 보장하는 유료연재 웹소설. 완결까지 달릴 작품을 라이크노벨에서 찾아보세요.",
  path: "/product/paid",
});

export default function PaidLayout({ children }: { children: ReactNode }) {
  return children;
}
