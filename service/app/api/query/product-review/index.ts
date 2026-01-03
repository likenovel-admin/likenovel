import {
  IUseAddProductReviewRequest,
  IUseSelectProductReviewDetailResponse,
  IUseSelectProductReviewResponse,
} from "@/app/api/query/product-review/dto";
import { useMutation, useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";

export const useSelectProductReview = (genres?: string[]) => {
  return useQuery<IUseSelectProductReviewResponse, unknown>({
    queryKey: ["selectProductReview", genres],
    queryFn: async () => {
      const genresQueryString =
        genres && genres.length > 0
          ? genres.map((genre) => `genres=${genre}`).join("&")
          : "";
      const response = await instance.get(
        `/v1/query/product-review?${genresQueryString}`
      );

      return response.data;
    },
  });
};

export const useSelectProductReviewDetail = (id: string | number) => {
  return useQuery<IUseSelectProductReviewDetailResponse, unknown>({
    queryKey: ["selectProductReviewDetail", id],
    queryFn: async () => {
      const response = await instance.get(`/v1/query/product-review/${id}`);

      return response.data;
    },
  });
};

export const useAddProductReview = () => {
  return useMutation({
    mutationFn: async (data: IUseAddProductReviewRequest) => {
      return await instance.post(`/v1/command/product-review`, data);
    },
  });
};

export const useLikeProductReview = () => {
  return useMutation({
    mutationFn: async (review_id: number) => {
      return await instance.post(
        `/v1/command/product-review/${review_id}/like`
      );
    },
  });
};

export const useUnLikeProductReview = () => {
  return useMutation({
    mutationFn: async (review_id: number) => {
      return await instance.delete(
        `/v1/command/product-review/${review_id}/like`
      );
    },
  });
};

export const useBlockProductReview = () => {
  return useMutation({
    mutationFn: async (review_id: number) => {
      return await instance.put(
        `/v1/command/product-review/${review_id}/block`
      );
    },
  });
};

export const useReportProductReview = () => {
  return useMutation({
    mutationFn: async ({
      review_id,
      body,
    }: {
      review_id: number;
      body: { report_reason: string; report_detail: string };
    }) => {
      return await instance.post(
        `/v1/command/product-review/${review_id}/report`,
        body
      );
    },
  });
};

export const useAddCommentProductReview = () => {
  return useMutation({
    mutationFn: async ({
      review_id,
      body,
    }: {
      review_id: number;
      body: { comment_text: string };
    }) => {
      return await instance.post(
        `/v1/command/product-review/${review_id}/comment`,
        body
      );
    },
  });
};

export const useUpdateCommentProductReview = () => {
  return useMutation({
    mutationFn: async ({
      comment_id,
      body,
    }: {
      comment_id: number | string;
      body: { comment_text: string };
    }) => {
      return await instance.put(
        `/v1/command/product-review/comment/${comment_id}`,
        body
      );
    },
  });
};

export const useBlockCommentProductReview = () => {
  return useMutation({
    mutationFn: async (commentId: number) => {
      return await instance.put(
        `/v1/command/product-review/comment/${commentId}/block`
      );
    },
  });
};

export const useReportCommentProductReview = () => {
  return useMutation({
    mutationFn: async ({
      comment_id,
      body,
    }: {
      comment_id: number;
      body: { report_reason: string; report_detail: string };
    }) => {
      return await instance.post(
        `/v1/command/product-review/comment/${comment_id}/report`,
        body
      );
    },
  });
};

export const useDeleteCommentProductReview = () => {
  return useMutation({
    mutationFn: async (comment_id: number | string) => {
      return await instance.delete(
        `/v1/command/product-review/comment/${comment_id}`
      );
    },
  });
};
