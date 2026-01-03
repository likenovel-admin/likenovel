import { IComment } from "@/components/common/CommentArea";

interface CommentResponse {
  commentTotalCount: number;
  timestamp: string;
  comments: IComment[];
}

export interface UseSelectCommentResponse {
  data: CommentResponse;
}
