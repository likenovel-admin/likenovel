import { instance } from "@/app/api/axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  IProfileRequest,
  ISelectUserCashParams,
  ISelectProfileFileResponse,
  ISelectUserCashResponse,
  ISelectUserCommentBlockResponse,
  ISelectUserCommentResponse,
  ISelectUserContractOfferResponse,
  ISelectUserInfoResponse,
  ISelectUserNotificationSettingsResponse,
  ISelectUserProductContractOfferedResponse,
  ISelectUserProductsWithPromotionsResponse,
  ISelectUserProductTicketResponse,
  ISelectUserProfileDetailResponse,
  ISelectUserProfilesResponse,
  ISelectUserPromotionIssuanceStatusResponse,
} from "./dto";
import {
  getUserInfoQueryIdentity,
  shouldEnableUserInfoQuery,
  USER_INFO_QUERY_STALE_TIME_MS,
} from "@/utils/userInfoQueryState";

export const useSelectUserInfo = (userId?: number, enabled = true) => {
  const requiresValidUserId = userId !== undefined;

  return useQuery<ISelectUserInfoResponse>({
    queryKey: ["selectUserInfo", getUserInfoQueryIdentity(userId)],
    queryFn: async () => {
      const response = await instance.get("/v1/query/user/info");
      return response.data;
    },
    enabled: shouldEnableUserInfoQuery({
      enabled,
      requiresValidUserId,
      userId,
    }),
    staleTime: USER_INFO_QUERY_STALE_TIME_MS,
  });
};

export const useSelectUserProfiles = () => {
  return useQuery<ISelectUserProfilesResponse>({
    queryKey: ["selectUserProfiles"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/user/profiles");
      return response.data;
    },
  });
};

export const useSelectUserProfileDetail = (profileId: string | number) => {
  return useQuery<ISelectUserProfileDetailResponse>({
    queryKey: ["selectUserProfileDetail", profileId],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/query/user/profiles/${profileId}/info`
      );
      return response.data;
    },
    enabled: !!profileId,
  });
};

export const useSelectProfileFile = () => {
  return useMutation<ISelectProfileFileResponse, Error, string>({
    mutationFn: async (fileName: string) => {
      const response = await instance.get(
        `/v1/query/user/profiles/upload/${fileName}`
      );
      return response.data;
    },
  });
};

export const useSelectUserContractOffers = () => {
  return useQuery<ISelectUserContractOfferResponse>({
    queryKey: ["selectUserContractOffers"],
    queryFn: async () => {
      const response = await instance.get(
        "/v1/query/user/products/contract-offers"
      );
      return response.data;
    },
  });
};

export const useSelectUserProductsWithPromotions = () => {
  return useQuery<ISelectUserProductsWithPromotionsResponse>({
    queryKey: ["selectUserProductsWithPromotions"],
    queryFn: async () => {
      const response = await instance.get(
        "/v1/query/user/products-with-promotions"
      );
      return response.data;
    },
  });
};

export const useSelectUserCash = (params?: ISelectUserCashParams) => {
  return useQuery<ISelectUserCashResponse>({
    queryKey: ["selectUserCash", params],
    queryFn: async () => {
      const response = await instance.get("/v1/query/user/cash", { params });
      return response.data;
    },
  });
};

export const useSelectUserProductContractOffered = () => {
  return useQuery<ISelectUserProductContractOfferedResponse>({
    queryKey: ["selectUserProductContractOffered"],
    queryFn: async () => {
      const response = await instance.get(
        "/v1/query/user/products/contract-offered"
      );
      return response.data;
    },
  });
};

export const useSelectUserComments = () => {
  return useQuery<ISelectUserCommentResponse>({
    queryKey: ["selectUserComments"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/user/comments");
      return response.data;
    },
  });
};

export const useSelectUserCommentsBlock = () => {
  return useQuery<ISelectUserCommentBlockResponse>({
    queryKey: ["selectUserCommentsBlock"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/user/comments/block");
      return response.data;
    },
  });
};

export const useSelectUserNotificationSettings = () => {
  return useQuery<ISelectUserNotificationSettingsResponse>({
    queryKey: ["selectUserNotificationSettings"],
    queryFn: async () => {
      const response = await instance.get(
        "/v1/query/user/notification-settings"
      );
      return response.data;
    },
  });
};

export const useSelectUserProductTicket = () => {
  return useQuery<ISelectUserProductTicketResponse>({
    queryKey: ["selectUserProductTicket"],
    queryFn: async () => {
      const response = await instance.get("/v1/query/user-productbook");
      return response.data;
    },
  });
};

export const useSelectUserPromotionIssuanceStatus = (id: number) => {
  return useQuery<ISelectUserPromotionIssuanceStatusResponse>({
    queryKey: ["selectUserPromotionIssuanceStatus", id],
    queryFn: async () => {
      const response = await instance.get(
        `/v1/command/user/direct-promotion/${id}/issuance-status`
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useUseRentalTicket = () => {
  return useMutation({
    mutationFn: async ({
      episode_id,
      rental_ticket_id,
    }: {
      episode_id: number;
      rental_ticket_id: number;
    }) => {
      return await instance.post(
        `/v1/command/user-productbook/${rental_ticket_id}/use`,
        {
          episode_id,
        }
      );
    },
  });
};

export const useUpdateUserNotificationSettings = () => {
  return useMutation({
    mutationFn: async (data: {
      benefit?: "Y" | "N";
      comment?: "Y" | "N";
      system?: "Y" | "N";
      event?: "Y" | "N";
      marketing?: "Y" | "N";
    }) => {
      return await instance.put("/v1/command/user/notification-settings", data);
    },
  });
};

export const useUserAlarmsMarkAsRead = () => {
  return useMutation({
    mutationFn: async () => {
      return await instance.put(`/v1/command/user/alarms/mark-as-read`);
    },
  });
};

export const useUserDirectPromotionStart = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      return await instance.post(
        `/v1/command/user/direct-promotion/${id}/start`
      );
    },
  });
};

export const useUserDirectPromotionEnd = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      return await instance.post(`/v1/command/user/direct-promotion/${id}/end`);
    },
  });
};

export const useUserDirectPromotionStop = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      return await instance.post(
        `/v1/command/user/direct-promotion/${id}/stop`
      );
    },
  });
};

export const useUserIssueDirectPromotion = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      return await instance.post(
        `/v1/command/user/direct-promotion/${id}/issue`
      );
    },
  });
};

export const useUserDirectPromotionSave = () => {
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        num_of_ticket_per_person_for_free_for_first?: number;
        num_of_ticket_per_person_for_reader_of_prev?: number;
      };
    }) => {
      return await instance.post(
        `/v1/command/user/products/${id}/direct-promotion/save`,
        data
      );
    },
  });
};

export const useUserAcceptOffer = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      return await instance.post(
        `/v1/command/user/products/contract-offers/${id}/accept`
      );
    },
  });
};

export const useUserRejectOffer = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      return await instance.post(
        `/v1/command/user/products/contract-offers/${id}/reject`
      );
    },
  });
};

export const useUserCancelAppliedPromotion = () => {
  return useMutation({
    mutationFn: async ({ productId }: { productId: number }) => {
      return await instance.post(
        `/v1/command/user/applied-promotion/${productId}/cancel`
      );
    },
  });
};

export const useUserApplyAppliedPromotion = () => {
  return useMutation({
    mutationFn: async ({
      productId,
      data,
    }: {
      productId: number;
      data: {
        type: string;
        start_date: string;
        end_date: string;
      };
    }) => {
      return await instance.post(
        `/v1/command/user/products/${productId}/applied-promotion/apply`,
        data
      );
    },
  });
};

export const useUserSendNotificationToBookmarkedUsers = () => {
  return useMutation({
    mutationFn: async ({
      productId,
      data,
    }: {
      productId: number;
      data: {
        content: string;
      };
    }) => {
      return await instance.post(
        `/v1/command/user/products/${productId}/send-notification-to-bookmarked-users`,
        data
      );
    },
  });
};

export const useUserApplyRole = () => {
  return useMutation({
    mutationFn: async (data: {
      apply_type: string;
      company_name: string;
      email: string;
      attachment_file_id_1st?: number;
      attachment_file_id_2nd?: number;
    }) => {
      return await instance.post(`/v1/command/user/apply-role`, data);
    },
  });
};

export const useUserAddProfiles = () => {
  return useMutation({
    mutationFn: async (data: IProfileRequest) => {
      return await instance.post(`/v1/command/user/profiles`, data);
    },
  });
};

export const useUserUpdateProfiles = () => {
  return useMutation({
    mutationFn: async (data: {
      id: string | number;
      body: IProfileRequest;
    }) => {
      return await instance.put(
        `/v1/command/user/profiles/${data.id}`,
        data.body
      );
    },
  });
};

export const usePurchaseNicknameChange = () => {
  return useMutation({
    mutationFn: async (profile_id: string | number) => {
      return await instance.post(
        `/v1/command/user/profiles/${profile_id}/purchase-nickname-change`
      );
    },
  });
};

export const useCheckNickNameDuplicate = () => {
  return useMutation({
    mutationFn: async (body: { user_nickname: string }) => {
      return await instance.post(
        `/v1/command/user/nickname/duplicate-check`,
        body
      );
    },
  });
};

export const useUserDeleteProfile = () => {
  return useMutation({
    mutationFn: async (id: string | number) => {
      return await instance.delete(`/v1/command/user/profiles/${id}`);
    },
  });
};

export const useUserSignoff = () => {
  return useMutation({
    mutationFn: async () => {
      return await instance.put(`/v1/command/auth/signoff`);
    },
  });
};

export const useAddContractOffer = () => {
  return useMutation({
    mutationFn: async ({
      product_id,
      body,
    }: {
      product_id: number;
      body: {
        advance_payment_range: string;
        cp_profit_rate: number;
        author_profit_rate: number;
        message: string;
      };
    }) => {
      return await instance.post(
        `/v1/command/products/${product_id}/contract-offer`,
        body
      );
    },
  });
};

export const usePurchaseEpisode = () => {
  return useMutation({
    mutationFn: async ({
      episode_id,
      body,
    }: {
      episode_id: number;
      body: {
        profile_id: number;
      };
    }) => {
      return await instance.post(
        `/v1/command/episodes/${episode_id}/purchase`,
        body
      );
    },
  });
};

export const usePurchaseAllEpisode = () => {
  return useMutation({
    mutationFn: async ({
      product_id,
      body,
    }: {
      product_id: number;
      body: {
        profile_id: number;
        purchase_type?: "own" | "rental";
      };
    }) => {
      return await instance.post(
        `/v1/command/products/${product_id}/purchase-all-episodes`,
        body
      );
    },
  });
};

export const useUserSponsor = () => {
  return useMutation({
    mutationFn: async ({
      author_id,
      profile_id,
      donation_price,
      message,
    }: {
      author_id: number;
      profile_id: number;
      donation_price: number;
      message: string;
    }) => {
      return await instance.post(`/v1/command/authors/${author_id}/sponsor`, {
        profile_id,
        donation_price,
        message,
      });
    },
  });
};

export const useUserSponsorProduct = () => {
  return useMutation({
    mutationFn: async ({
      product_id,
      profile_id,
      donation_price,
      message,
    }: {
      product_id: number;
      profile_id: number;
      donation_price: number;
      message: string;
    }) => {
      return await instance.post(`/v1/command/products/${product_id}/sponsor`, {
        profile_id,
        donation_price,
        message,
      });
    },
  });
};

// export const useNiceToken = async () => {
//   const authForAccessToken = "Basic "+btoa("435b5e4c-1b20-4538-bf77-7fdb0b5b2138"+":"+"ea159652372296cc604bb76383e7c919");

//   console.log("authForAccessToken:", authForAccessToken);

//   const response = await axios({
//     method: 'POST',
//     url: 'https://svc.niceapi.co.kr:22001/digital/niceid/oauth/oauth/token',
//     headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'Authorization': `Basic ${authForAccessToken}`
//     },
//     data: {
//       grant_type: "client_credentials",
//       scope: "default"
//     }
//   });

//   console.log("response result:", response);
// };
