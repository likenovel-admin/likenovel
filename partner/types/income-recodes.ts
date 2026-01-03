export interface IIncomeRecode {
  id: number;
  product_id: number;
  title: string;
  author_nickname: string;
  item_type: "sponsorship" | string;
  sum_income_price: number;
  created_id: number | null;
  created_date: string;
  updated_id: number | null;
  updated_date: string;
  author_id: number;
}
