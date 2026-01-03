import { IUserAdmin } from "@/types/user";

export interface IAuth {
  auth: {
    accessToken: string;
    accessTokenExpiresIn: number;
    refreshToken: string;
    refreshTokenExpiresIn: number;
    recentSignInType: string;
    userId: number;
    birthDate: string;
    gender: string;
  };
}

export interface ILoginInRequest {
  email: string;
  password: string;
  keep_signin_yn: string;
  sns_signup_type?: string;
  sns_link_id?: string;
}

export interface ILoginInResponse {
  data: IAuth;
}

export type IAdminDetailResponse = IUserAdmin[];
