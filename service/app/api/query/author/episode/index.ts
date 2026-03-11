import { instance } from "@/app/api/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ICreateAuthorEpisodePredictionRequest,
  IGetProductNoticeDetailResponse,
  IMakeEpisodeRequest,
  IMakeNoticeRequest,
  ISelectEpisodeResponse,
  ISelectNoticeResponse,
  ISelectPresignedFilePathResponseByEpisode,
} from "./dto";

export const useSelectPresignedFilePathByEpisode = () => {
  return useMutation<ISelectPresignedFilePathResponseByEpisode, Error, string>({
    mutationFn: async (fileName: string) => {
      const response = await instance.get(
        `/v1/query/episodes/episode/upload/${fileName}`
      );
      return response.data;
    },
  });
};

export const useSelectStoragePath = () => {
  return useMutation({
    mutationFn: async (fileId: number) => {
      const response = await instance.get(
        `/v1/query/episodes/episode/download/${fileId}`
      );
      return response.data;
    },
  });
};

export const useMakeEpisode = () => {
  return useMutation<
    unknown,
    Error,
    {
      data: IMakeEpisodeRequest;
      productId: number;
      isSave: "Y" | "N";
      episodeId: number | null;
    }
  >({
    mutationFn: async ({ data, productId, isSave, episodeId }) => {
      console.log("data", data, productId, isSave, episodeId);
      const {
        title,
        content,
        author_comment,
        comment_open_yn,
        evaluation_open_yn,
        episode_open_yn,
        publish_reserve_yn,
        publish_reserve_date,
        price_type,
      } = data;

      let queryString = {};

      if (episodeId) {
        queryString = new URLSearchParams({
          save: isSave,
          episode_id: episodeId.toString(),
        }).toString();
      } else {
        queryString = new URLSearchParams({
          save: isSave,
        }).toString();
      }

      const url = `/v1/command/episodes/products/${productId}?${queryString}`;

      return await instance.post(url, {
        title,
        content,
        author_comment,
        comment_open_yn,
        evaluation_open_yn,
        episode_open_yn,
        publish_reserve_yn,
        publish_reserve_date,
        price_type,
      });
    },
  });
};

export const useMakeNotice = () => {
  return useMutation<
    unknown,
    Error,
    {
      data: IMakeNoticeRequest;
      productId: number;
      isSave: "Y" | "N";
      product_notice_id: number | null;
    }
  >({
    mutationFn: async ({ data, productId, isSave, product_notice_id }) => {
      console.log("data", data, productId, isSave, product_notice_id);
      const {
        title,
        content,
        open_yn,
        publish_reserve_yn,
        publish_reserve_date,
      } = data;

      let queryString = {};

      if (product_notice_id) {
        queryString = new URLSearchParams({
          save: isSave,
          product_notice_id: product_notice_id.toString(),
        }).toString();
      } else {
        queryString = new URLSearchParams({
          save: isSave,
        }).toString();
      }

      const url = `/v1/command/products/${productId}/notices?${queryString}`;

      return await instance.post(url, {
        title,
        content,
        open_yn,
        publish_reserve_yn,
        publish_reserve_date,
      });
    },
  });
};

export const useSelectEpisode = () => {
  return useMutation<ISelectEpisodeResponse, Error, number>({
    mutationFn: async (episodeId: number) => {
      const response = await instance.get(
        `/v1/query/episodes/${episodeId}/info`
      );
      return response.data;
    },
  });
};

export const useSelectNotice = () => {
  return useMutation<ISelectNoticeResponse, Error, number>({
    mutationFn: async (notice: number) => {
      const response = await instance.get(
        `/v1/query/products/notices/${notice}/info`
      );
      return response.data;
    },
  });
};

export const useGetProductNoticeDetail = (
  id: string | number,
  enabled?: boolean
) => {
  return useQuery<IGetProductNoticeDetailResponse, unknown>({
    queryKey: ["getProductNoticeDetail", id],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/products/notices/${id}/info`
      );
      return response.data;
    },
    enabled: !!enabled,
    throwOnError: false,
  });
};

export const useUpdateEpisode = () => {
  return useMutation<
    unknown,
    Error,
    { episodeId: number; data: IMakeEpisodeRequest }
  >({
    mutationFn: async ({ episodeId, data }) => {
      return await instance.put(`/v1/command/episodes/${episodeId}`, data);
    },
  });
};

export const useUpdateNotice = () => {
  return useMutation<
    unknown,
    Error,
    { noticeId: number; data: IMakeNoticeRequest }
  >({
    mutationFn: async ({ noticeId, data }) => {
      return await instance.put(
        `/v1/command/products/notices/${noticeId}`,
        data
      );
    },
  });
};

export const useOpenEpisode = () => {
  return useMutation<unknown, Error, { episodeId: number }>({
    mutationFn: async ({ episodeId }) => {
      return await instance.put(`/v1/command/episodes/${episodeId}/open`);
    },
  });
};

export const useCancelReserveEpisode = () => {
  return useMutation<unknown, Error, { episode_ids: number[] }>({
    mutationFn: async (body) => {
      return await instance.post(`/v1/command/episodes/sale-reserve-cancel`, body);
    },
  });
};

export const useOpenNotice = () => {
  return useMutation<unknown, Error, { noticeId: number }>({
    mutationFn: async ({ noticeId }) => {
      return await instance.put(
        `/v1/command/products/notices/${noticeId}/open`
      );
    },
  });
};

export const useCreateAuthorEpisodePrediction = () => {
  return useMutation<
    unknown,
    Error,
    ICreateAuthorEpisodePredictionRequest
  >({
    mutationFn: async (data: ICreateAuthorEpisodePredictionRequest) => {
      return await instance.post("/v1/command/predictions/author-episode", data);
    },
  });
};
