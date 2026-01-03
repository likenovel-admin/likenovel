export interface IFaq {
  id: number;
  type: "common" | "member" | "use" | "payment" | "site" | "service";
  question: string;
  answer: string;
  postingDate: string;
}

export interface SelectFaqsResponse {
  data: {
    totalItems: number;
    page: number;
    countPerPage: number;
    items: IFaq[];
  };
}
