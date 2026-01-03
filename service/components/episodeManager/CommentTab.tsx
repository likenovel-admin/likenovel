import CommentList from "@/components/viewer/CommentList";
import { IComment } from "../common/CommentArea";

interface CommentTabProps {
  productId: number;
  comments?: IComment[];
}

const CommentTab = ({ productId, comments }: CommentTabProps) => {
  return (
    <div>
      <CommentList
        pageType="author"
        productId={productId}
        hasEpisode
        hasAuthorFixedComment
      />
    </div>
  );
};
export default CommentTab;
