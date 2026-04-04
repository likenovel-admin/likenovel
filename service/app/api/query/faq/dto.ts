export interface IFaq {
  id: number;
  type: string;
  typeName?: string;
  question: string;
  answer: string;
  postingDate: string;
}

export interface IFaqCategory {
  code: string;
  name: string;
  sortOrder: number;
}

export interface SelectFaqsResponse {
  data: {
    totalItems: number;
    page: number;
    countPerPage: number;
    items: IFaq[];
  };
}

export interface SelectFaqCategoriesResponse {
  data: {
    items: IFaqCategory[];
  };
}
