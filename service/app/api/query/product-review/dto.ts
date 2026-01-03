import { ICommentProductReview, IProduct, IProductReview } from "@/types";

export interface IUseSelectProductReviewResponse {
  data: {
    review: IProductReview;
    product: IProduct;
  }[];
}

export interface IUseSelectProductReviewDetailResponse {
  data: {
    review: IProductReview;
    product: IProduct;
    comments: ICommentProductReview[];
  };
}

export interface IUseAddProductReviewRequest {
  product_id: number;
  episode_id?: number;
  user_id?: number;
  review_text: string;
  review_title?: string;
}
