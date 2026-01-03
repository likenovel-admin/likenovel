export interface IAppliedPromotion {
  id: number;
  title: string;
  type: string;
  status: string;
  author_name: string;
  created_id: number;
  created_date: string;
  updated_id: number | null;
  updated_date: string;
  start_date: string;
  end_date: string;
  product_id: number;
  num_of_ticket_per_person: number;
}
