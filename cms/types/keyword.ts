export interface ICategory {
  category_id: number;
  category_code: string;
  category_name: string;
  use_yn: string;
  createdDate: string;
  updatedDate: string;
}

export interface IKeyword {
  category_code: string;
  category_id: number;
  created_date: string;
  created_id: number;
  filter_yn: string;
  keyword_id: number;
  keyword_name: string;
  major_genre_yn: string;
  updated_date: string;
  updated_id: number;
  use_count: number;
  use_yn: string;
}
