export interface IMainCharacterSlot {
  characterSlotId: number;
  productId: number;
  characterScopeKey: string;
  characterName: string;
  characterImagePath: string | null;
  cardOrder: number;
  productTitle: string;
  authorNickname: string;
  publishStartAt: string;
  publishEndAt: string | null;
  createdDate: string;
  updatedDate: string;
}

export interface IMainCharacterSlotProduct {
  productId: number;
  title: string;
  authorNickname: string;
  coverImagePath: string | null;
  openEpisodeCount: number;
}

export interface IMainCharacterSlotRosterItem {
  scopeKey: string;
  displayName: string;
  aliases: string[];
}

export interface IGetMainCharacterSlotParams {
  page?: number;
  count_per_page?: number;
}

export interface IGetMainCharacterSlotResponse {
  total_count: number;
  page: number;
  count_per_page: number;
  results: IMainCharacterSlot[];
}

export interface ISearchMainCharacterSlotProductResponse {
  data: IMainCharacterSlotProduct[];
}

export interface IGetMainCharacterSlotRosterResponse {
  data: IMainCharacterSlotRosterItem[];
}

export interface IMainCharacterSlotRequest {
  product_id: number;
  character_scope_key: string;
  character_image_file_id?: number;
  card_order: number;
  publish_start_at?: string;
  publish_end_at?: string | null;
}

export interface IMainCharacterSlotCommandResponse {
  result: unknown;
}
