export interface IPlatformServiceRateOverrideItem {
  product_id: number;
  title: string | null;
  current_rate: number | null;
  next_rate: number;
  effective_month: string;
}

export interface IPlatformServiceRateConfig {
  current_global_rate: number;
  next_global_rate: number;
  next_effective_month: string;
  payment_fee_rate: number;
  overrides: IPlatformServiceRateOverrideItem[];
}

export interface IPlatformServiceRateGlobalRequest {
  rate: number;
}

export interface IPlatformServiceRateProductRequest {
  product_id: number;
  rate: number;
}

export interface IProductSimpleItem {
  product_id: number;
  title: string;
}
