import { useMutation, useQuery } from "@tanstack/react-query";
import { instance } from "../../axios";

export const useChangeBookmark = () => {
  return useMutation({
    mutationFn: async (productId: number) => {
      return await instance.put(`/v1/command/products/${productId}/bookmark`);
    },
  });
};

export const useAllBookmarkDelete = () => {
  return useMutation({
    mutationFn: async () => {
      return await instance.delete(`/v1/command/products/bookmark`);
    },
  });
};

export const useSelectBookmarks = () => {
  return useQuery({
    queryKey: ["selectBookmarks"],
    queryFn: async () => {      
      const response = await instance.get(`/v1/query/products/bookmark`);      
      return response.data.data;    
    } 
  });
};
