import {
  SelectFaqCategoriesResponse,
  SelectFaqsResponse,
} from "@/app/api/query/faq/dto";
import { useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";

export const useGetFaq = (
  category: string,
  page: number = 1,
  countPerPage: number = 10
) => {
  return useQuery<SelectFaqsResponse>({
    queryKey: ["faqList", category, page, countPerPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        category,
        page: page.toString(),
        count_per_page: countPerPage.toString(),
      });
      const response = await instance.get(
        `/v1/query/support/faqs?${params.toString()}`
      );
      return response.data;
    },
  });
};

export const useGetFaqCategories = () => {
  return useQuery<SelectFaqCategoriesResponse>({
    queryKey: ["faqCategories"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/support/faq-categories");
      return response.data;
    },
  });
};
