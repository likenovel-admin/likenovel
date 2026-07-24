import { buildPageMetadata } from "@/utils/siteSeoMetadata";
import type { ReactNode } from "react";

export const metadata = buildPageMetadata({
  title: "주인공챗",
  description:
    "읽은 회차까지만 아는 웹소설 주인공과 대화하고 새로운 이야기를 이어가 보세요.",
  path: "/product/character-chat",
});

export default function CharacterChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
