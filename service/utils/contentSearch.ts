export interface ContentSearchState {
  keyword: string;
  tags: string[];
  orderby: "relevance" | "update";
  page: number;
}

export const readContentSearch = (params: URLSearchParams): ContentSearchState => ({
  keyword: (params.get("keyword") || "").slice(0, 100),
  tags: Array.from(new Set(params.getAll("tag"))).filter((tag) => tag.length <= 120).slice(0, 12),
  orderby: params.get("orderby") === "update" ? "update" : "relevance",
  page: Math.max(1, Math.min(10000, Number.parseInt(params.get("page") || "1", 10) || 1)),
});

export const contentSearchParams = (state: ContentSearchState) => {
  const params = new URLSearchParams({ keyword: state.keyword.trim(), orderby: state.orderby });
  state.tags.forEach((tag) => params.append("tag", tag));
  if (state.page > 1) params.set("page", String(state.page));
  return params;
};

export const contentSearchPath = (state: ContentSearchState) =>
  `/product/search/result/normal?${contentSearchParams(state)}`;

export const searchTagLabel = (id: string) =>
  id.startsWith("dna:") ? id.split(":").slice(2).join(":") : "작품 태그";
