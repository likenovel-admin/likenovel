import useToastStore from "@/store/toastStore";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { instance } from "../../axios";
import { UseSelectCommentResponse } from "./dto";

export const useSelectComment = (
  productId: number,
  page: number,
  limit: number,
  order: string,
  keepPreviousData: boolean = true,
  enabled: boolean = true
) => {
  return useInfiniteQuery<UseSelectCommentResponse>({
    queryKey: ["selectComment", productId, page, limit, order],
    queryFn: async ({ queryKey, pageParam }) => {
      const [_, productId, page, limit, order] = queryKey;
      const response = await instance.get(
        `/v1/query/products/${productId}/comments?page=${pageParam}&limit=${limit}&order=${order}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return lastPage.data.comments.length === 0 ? undefined : nextPage;
    },
    initialPageParam: 1,
    enabled: enabled && !Number.isNaN(productId),
    placeholderData: keepPreviousData
      ? (previousData) => previousData
      : undefined,
  });
};

export const useSelectCommentByEpisode = (
  productId: number,
  episodeId: number,
  page: number,
  limit: number = 10,
  order: string = "recommend"
) => {
  return useInfiniteQuery<UseSelectCommentResponse>({
    queryKey: ["selectComment", productId, episodeId, order],
    queryFn: async ({ queryKey, pageParam = 1 }) => {
      const [_, productId, episodeId, order] = queryKey;
      const response = await instance.get(
        `/v1/query/products/${productId}/comments?episode_id=${episodeId}&page=${pageParam}&limit=${limit}&order=${order}`
      );
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return lastPage.data.comments.length === 0 ? undefined : nextPage;
    },
    initialPageParam: 1,
    enabled: !Number.isNaN(productId) && !Number.isNaN(episodeId),
  });
};

export const useChangeComment = (enableCallbacks: boolean = true) => {
  const queryClient = useQueryClient();
  const { setToast } = useToastStore();
  return useMutation({
    mutationFn: async ({
      productId,
      commentId,
      content,
    }: {
      productId: number;
      commentId: number;
      content: string;
    }) => {
      try {
        const response = await instance.put(
          `/v1/command/products/comments/${commentId}`,
          {
            content,
          }
        );
        return response.data;
      } catch (error) {
        throw new Error("댓글 수정에 실패했습니다.");
      }
    },
    onSuccess: (data, variables) => {
      if (!enableCallbacks) return;

      queryClient.invalidateQueries({
        queryKey: ["selectComment", variables.productId],
      });
      setToast({
        message: "댓글이 수정되었습니다.",
        type: "success",
      });
    },
    onError: (error) => {
      if (!enableCallbacks) return;

      setToast({
        message: "댓글 수정에 실패하였습니다.",
        type: "error",
      });
    },
  });
};

export const useDeleteComment = () => {
  return useMutation({
    mutationFn: async (commentId: number) => {
      return await instance.delete(
        `/v1/command/products/comments/${commentId}`
      );
    },
  });
};

export const useReportComment = () => {
  return useMutation({
    mutationFn: async ({
      commentId,
      reportType,
      content,
    }: {
      commentId: number;
      reportType: string;
      content: string;
    }) => {
      return await instance.post(
        `/v1/command/products/comments/${commentId}/report`,
        {
          reportType,
          content,
        }
      );
    },
  });
};

export const useBlockComment = () => {
  return useMutation({
    mutationFn: async (commentId: number) => {
      return await instance.put(
        `/v1/command/products/comments/${commentId}/block`
      );
    },
  });
};

export const usePinComment = () => {
  return useMutation({
    mutationFn: async (commentId: number) => {
      return await instance.put(
        `/v1/command/products/comments/${commentId}/pin`
      );
    },
  });
};

export const useRecommendComment = () => {
  return useMutation({
    mutationFn: async (commentId: number) => {
      return await instance.put(
        `/v1/command/products/comments/${commentId}/reaction/recommend`
      );
    },
  });
};

export const useNotRecommendComment = () => {
  return useMutation({
    mutationFn: async (commentId: number) => {
      return await instance.put(
        `/v1/command/products/comments/${commentId}/reaction/not-recommend`
      );
    },
  });
};
