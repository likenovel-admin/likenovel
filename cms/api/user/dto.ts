import { IUser, IUserDetail } from "@/types/user";

export interface IGetUserResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IUser[];
}

export interface IGetUserAllResponse {
  data: IUser[];
}

export interface IGetUserParams {
  page?: number;
  count_per_page?: number;
  search_target?: string;
  search_word?: string;
  status?: string;
}

export type IGetUserDetailResponse = IUserDetail;

export interface IResetPasswordResponse {
  data: {
    message: string;
  };
}

export interface IResetPasswordRequest {
  email?: string;
  password?: string;
  user_name?: string;
  birthdate?: string;
  gender?: string;
}

export interface IEditAdminRightResponse {
  data: {
    message: string;
  };
}

export interface IEditAdminRightRequest {
  role_type: string;
}

export interface ISignOffResponse {
  data: {
    message: string;
  };
}

export interface IDeleteProfileResponse {
  data: {
    message: string;
  };
}

export interface ICreateAccountRequest {
  email: string;
  password: string;
}
