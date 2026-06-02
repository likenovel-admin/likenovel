export interface IMainSingleSlot {
  singleSlotId: number;
  slotKey: string;
  slotName: string;
  slotOrder: number;
  productId: number;
  productTitle: string;
  authorNickname: string;
  summaryText: string;
  publishStartAt: string;
  publishEndAt: string | null;
  cancelledAt: string | null;
  createdDate: string;
  updatedDate: string;
}

export interface IMainSingleSlotProduct {
  productId: number;
  title: string;
  authorNickname: string;
  coverImagePath: string | null;
  openEpisodeCount: number;
}

export interface IGetMainSingleSlotParams {
  slot_key?: string;
  page?: number;
  count_per_page?: number;
}

export interface IGetMainSingleSlotResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IMainSingleSlot[];
}

export interface ISearchMainSingleSlotProductParams {
  search_word?: string;
  limit?: number;
}

export interface ISearchMainSingleSlotProductResponse {
  data: IMainSingleSlotProduct[];
}

export interface IMainSingleSlotRequest {
  slot_key: string;
  slot_name: string;
  slot_order: number;
  product_id: number;
  summary_text: string;
  publish_start_at?: string;
  publish_end_at?: string | null;
}

export interface IMainSingleSlotCommandResponse {
  result: unknown;
}
