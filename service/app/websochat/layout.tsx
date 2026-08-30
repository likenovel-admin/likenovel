import { buildPageMetadata } from "@/utils/siteSeoMetadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "웹소챗",
  description:
    "작품에 대해 묻는 웹소챗부터 주인공과 대화하는 주인공챗까지, 웹소설과 대화를 시작해보세요.",
  path: "/websochat",
});

export default function WebsochatLayout({ children }: { children: ReactNode }) {
  return children;
}
