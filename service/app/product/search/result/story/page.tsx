import { redirect } from "next/navigation";
import { contentSearchPath } from "@/utils/contentSearch";

// Preserve old links without exposing fixture results or starting an AI call.
export default function StorySearchResult({ searchParams }: { searchParams: { keyword?: string } }) {
  redirect(contentSearchPath({ keyword: searchParams.keyword || "", tags: [], orderby: "relevance", page: 1 }));
}
