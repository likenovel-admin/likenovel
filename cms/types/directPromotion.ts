export interface IDirectPromotion {
  id: number;
  product_id: number;
  start_date: string;
  type: string;
  status: string;
  num_of_ticket_per_person: number;
  created_id: number | null;
  created_date: string;
  updated_id: number | null;
  updated_date: string;
  title: string;
  author_name: string;
}
