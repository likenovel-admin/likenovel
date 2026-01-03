export interface IUserGiftBook {
  user_id: number;
  gift_count: number;
  email: string; // ISO date string
  recent_gift_date: string; // ISO date string
}

export interface HistoryEntry {
  received_history: ReceivedHistory[];
  usage_history: UsageHistory[];
}

export interface ReceivedHistory {
  reason: string;
  expire_date: string; // ISO 8601 datetime string (e.g., "2024-08-02T16:00:00")
  received_date: string;
  target_product_title: string;
  target_product_author_name: string;
  amount: number;
}

export interface UsageHistory {
  title: string;
  author_name: string;
  ticket_type: "comped" | string; // "comped" is one known value; you can extend this if needed
  use_date: string;
}
