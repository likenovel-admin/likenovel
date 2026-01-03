export interface IDailyTicket {
  id: number;
  product_id: number;
  title: string;
  author_nickname: string;
  contract_type: string;
  cp_company_name: string;
  paid_open_date: string;
  isbn: string;
  uci: string;
  episode_no: number;
  item_name: string;
  count_ticket_usage: number;
  created_date: string;
  updated_date: string;
  publish_regular_yn: "Y" | "N";
}
