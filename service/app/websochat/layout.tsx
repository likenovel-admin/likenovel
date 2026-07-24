import { buildPageMetadata } from "@/utils/siteSeoMetadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "웹소챗",
  description: "읽던 작품의 주인공과 새로운 이야기를 이어가 보세요.",
  path: "/websochat",
});

export default function WebsochatLayout({ children }: { children: ReactNode }) {
  return children;
}
