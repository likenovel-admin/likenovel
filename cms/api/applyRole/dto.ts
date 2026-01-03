import { IApplyRole } from "@/types/applyRole";

export interface IGetApplyRoleResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IApplyRole[];
}

export interface IGetApplyRoleAllResponse {
  data: IApplyRole[];
}

export interface IGetApplyRoleParams {
  page?: number;
  count_per_page?: number;
  status?: string;
}

export interface IAcceptApplyRoleResponse {
  data: {
    message: string;
  };
}
export interface IDenyApplyRoleResponse {
  data: {
    message: string;
  };
}
