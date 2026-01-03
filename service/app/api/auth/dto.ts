import { IRole, ISocialLoginProvider } from "@/types";

export interface IRefreshTokenRequest {
  access_token: string;
  refresh_token: string;
}

export interface ISignInRequest {
  email: string;
  password: string;
  keep_signin_yn: string;
}

export interface ISignInResponse {
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

export interface IEmailSignUpRequest {
  email: string;
  password: string;
  birthdate: string;
  gender: string;
  ad_info_agree_yn: string;
}

export interface IPasswordResetRequest {
  email?: string;
  password?: string;
  birthdate?: string;
  gender?: string;
}

export interface ISelectUserResponse {
  data: {
    userId: number;
    birthDate: string;
    gender: string;
    recentSignInType: ISocialLoginProvider;
    adultToggleDisplayYn: string;
    userRole: IRole;
  };
}
