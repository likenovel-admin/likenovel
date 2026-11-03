"use client";

import SearchWorkspace from "@/components/search/SearchWorkspace";
import { readContentSearch } from "@/utils/contentSearch";
import { useSearchParams } from "next/navigation";

export default function NormalSearchResult() {
  const params = useSearchParams();
  return <main className="mx-auto w-full max-w-[770px] px-16pxr py-24pxr">
    <h1 className="mb-20pxr text-24pxr font-bold">작품 찾기</h1>
    <SearchWorkspace initialState={readContentSearch(new URLSearchParams(params.toString()))} />
  </main>;
}
