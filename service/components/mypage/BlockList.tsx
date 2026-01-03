import { useBlockComment } from "@/app/api/query/comment";
import { ICommentBlock } from "@/app/api/query/mypage/user/dto";
import {
  useBlockCommentProductReview,
  useBlockProductReview,
} from "@/app/api/query/product-review";
import useConfirmStore from "@/store/confirmStore";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import Image from "next/image";
import Button from "../common/Button";

interface BlockListProps {
  blocks: ICommentBlock[];
}

const BlockList = ({ blocks }: BlockListProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync: blockComment } = useBlockComment();
  const { mutateAsync: blockReviewComment } = useBlockCommentProductReview();
  const { mutateAsync: unblockReview } = useBlockProductReview();
  const { setToast } = useToastStore();
  const { setConfirm } = useConfirmStore();

  const handleUnblockClick = (
    commentId: number,
    userNickname: string,
    type: "episode" | "product_review" | "review" | string
  ) => {
    setConfirm({
      content: (
        <div className="flex flex-col gap-[5px]">
          <span className="text-15pxr md:text-18pxr font-bold text-center">
            {userNickname}님의 <br /> 댓글 차단을 해제하시겠습니까?
          </span>
        </div>
      ),
      onConfirm: async () => {
        try {
          // Use blockReviewComment for product-review type, blockComment for others
          const unblockFn =
            type === "product_review"
              ? unblockReview
              : type === "review"
              ? blockReviewComment
              : blockComment;

          await unblockFn(commentId, {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ["selectUserCommentsBlock"],
              });
              setToast({
                message: "차단이 해제되었습니다.",
                type: "success",
              });
            },
            onError: (error: any) => {
              setToast({
                message:
                  error?.response?.data?.message || "차단 해제에 실패했습니다.",
                type: "error",
              });
            },
          });
        } catch (error) {
          setToast({
            message: "차단 해제에 실패했습니다.",
            type: "error",
          });
        }
      },
      confirmText: "해제",
    });
  };

  return (
    <div className="pt-6 mt-6 border-t">
      {blocks.length > 0 ? (
        blocks.map((block) => (
          <CommentItem
            {...block}
            key={block.commentId}
            onUnblock={() =>
              handleUnblockClick(
                block.commentId || block.reviewId,
                block.userNickname,
                block.commentType
              )
            }
          />
        ))
      ) : (
        <div className="text-center py-20 text-dark-gray-400">
          차단한 댓글이 없습니다.
        </div>
      )}
    </div>
  );
};

export default BlockList;

interface CommentItemProps extends ICommentBlock {
  onUnblock: () => void;
}

const CommentItem = ({ onUnblock, ...block }: CommentItemProps) => {
  return (
    <div className="flex flex-col">
      <div className="relative flex items-start gap-16pxr">
        <Image
          src={block.userProfileImagePath}
          alt="프로필"
          width={30}
          height={30}
          className="w-[30px] h-[30px] rounded-full mt-[7px]"
        />
        <div className="flex flex-col w-full">
          <div className="flex justify-between w-full">
            <div className="flex gap-5pxr">
              <div className="flex items-center gap-5pxr">
                <span className="text-14pxr font-semibold">
                  {block.userNickname}
                </span>
                <Image
                  src={block.userEventLevelBadgeImagePath}
                  alt="레벨"
                  width={12}
                  height={14}
                  className="w-[12px] h-[15px]"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-14pxr">
              <span className="text-12pxr text-dark-gray-400 mt-11pxr">
                차단일 {dayjs(block.publishDate).format("YYYY.MM.DD")}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          size="lg"
          className="my-auto min-w-[100px] right-0 hidden md:block"
          onClick={onUnblock}
        >
          차단해제
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="my-auto min-w-[90px] right-0 md:hidden block"
          onClick={onUnblock}
        >
          차단해제
        </Button>
      </div>
      <div className="w-full border border-t-light-gray-300 border-b-0 border-l-0 border-r-0 mt-25pxr mb-20pxr" />
    </div>
  );
};
