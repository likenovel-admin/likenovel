export interface IUserAdmin {
  profile_id: number;
  user_id: number;
  nickname: string;
  default_yn: string;
  role_type: string;
  profile_image_path: string;
  nickname_change_max_count: number;
  nickname_change_count: number;
  created_id: number;
  created_date: string;
  updated_id: number;
  updated_date: string;
}

export interface IUser {
  user_id: number;
  name: string;
  nickname: string;
  email: string;
  phone: string;
  created_date: string;
  latest_signed_date: string;
  signoff_date: string;
  agree_terms_yn: string;
  noti_yn: string;
}

export interface IUserDetail {
  user_id: number;
  kc_user_id: string;
  email: string;
  gender: string;
  birthdate: string;
  user_name: string;
  nickname: string;
  phone: string;
  identity_yn: string;
  agree_terms_yn: string;
  agree_privacy_yn: string;
  agree_age_limit_yn: string;
  stay_signed_yn: string;
  latest_signed_date: string;
  latest_signed_type: string;
  use_yn: string;
  role_type: string;
  created_id: number;
  created_date: string;
  updated_id: number;
  updated_date: string;
  profiles: Profile[];
}

export interface Profile {
  profile_id: number;
  user_id: number;
  nickname: string;
  default_yn: string;
  role_type: string;
  profile_image_id: number;
  nickname_change_max_count: number;
  nickname_change_count: number;
  created_id: number;
  created_date: string;
  updated_id: number;
  updated_date: string;
  profile_image_path: string;
}
