import { ISocialLoginProvider } from "@/types";

export interface IStorageRelayRequest {
  sns_id: number;
  temp_issued_key: string;
}

export interface IStorageRelayResponse {
  data: {
    data: {
      auth: {
        accessToken: string;
        accessTokenExpiresIn: number;
        refreshToken: string;
        refreshTokenExpiresIn: number;
        recentSignInType: ISocialLoginProvider;
        userId: number;
        birthDate: string;
        gender: string;
      };
    };
  };
}

