"use client";

import {
  useDeleteComment,
  useDeleteNotice,
  useDeleteReview,
} from "@/api/reviewCommentNotice";
import CommonTable, { Column } from "@/components/common/CommonTable";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { catchErrorMessage, confirm, showAlert } from "@/lib/utils";
import {
  ICommentInList,
  INoticeInList,
  IReviewInList,
} from "@/types/reviewCommentNotice";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export type DataType = IReviewInList | ICommentInList | INoticeInList;

export function isReview(row: DataType): row is IReviewInList {
  return "type" in row && row.type === "review";
}

export function isComment(row: DataType): row is ICommentInList {
  return "type" in row && row.type === "comment";
}

export function isNotice(row: DataType): row is INoticeInList {
  return "type" in row && row.type === "notice";
}

interface Props {
  data: DataType[];
  loading?: boolean;
  refetch: () => void;
}

export default function DataTable({ data, loading, refetch }: Props) {
  const router = useRouter();
  const deleteReview = useDeleteReview();
  const deleteNotice = useDeleteNotice();
  const deleteComment = useDeleteComment();

  const handleDelete = async (row: DataType) => {
    if (
      deleteReview.isPending ||
      deleteNotice.isPending ||
      deleteComment.isPending
    ) {
      return;
    }
    const itemType = isReview(row)
      ? "리뷰"
      : isComment(row)
        ? "댓글"
        : isNotice(row)
          ? "공지"
          : "항목";

    const result = await confirm({
      title: `${itemType} 삭제`,
      text: `해당 ${itemType}을 삭제하시겠습니까?`,
      confirm: "삭제하기",
      cancel: "취소",
    });

    if (!result.isConfirmed) return;

    const id = isComment(row) ? row.id : row.id;

    const mutation = isReview(row)
      ? deleteReview
      : isComment(row)
        ? deleteComment
        : deleteNotice;

    mutation.mutate(id + "", {
      onSuccess: () => {
        refetch();
      },
      onError: (err: any) => {
        showAlert("오류", catchErrorMessage(err), "확인");
      },
    });
  };

  const columns: Column[] = [
    {
      header: "종류",
      key: "type",
      render: (_, row: DataType) => {
        if (isReview(row)) return "리뷰";
        if (isComment(row)) return "댓글";
        if (isNotice(row)) return "공지";
        return "-";
      },
    },
    {
      header: "작성자",
      key: "author",
      render: (_, row: DataType) => `${row.user_name}`,
    },
    {
      header: "제목 / 내용",
      key: "title_content",
      render: (_, row: DataType) => {
        if (isReview(row)) return row.contents;
        if (isComment(row)) return row.contents;
        if (isNotice(row)) return row.contents;
        return "-";
      },
    },
    {
      header: "대상 작품명",
      key: "target_work",
      render: (_, row: DataType) => `${row.product_title}`,
    },
    {
      header: "작성 일자",
      key: "written_date",
      render: (_, row: DataType) => {
        return `${row.created_date ? format(new Date(row.created_date), "yyyy-MM-dd") : ""}`;
      },
    },
    {
      header: "노출",
      key: "visibility",
      render: (_, row: DataType) => {
        return `${row.open_yn === "Y" ? "공개" : "비공개"}`;
      },
    },
    {
      header: "상세",
      key: "detail",
      render: (_, row: DataType) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={
              isReview(row)
                ? () => router.push(`/products/reviews/${row.id}`)
                : isComment(row)
                  ? () => router.push(`/products/comments/${row.id}`)
                  : () => router.push(`/products/notices/${row.id}`)
            }
          >
            상세
          </Button>
          <Button variant="outline" onClick={() => handleDelete(row)}>
            삭제
          </Button>
        </div>
      ),
    },
  ];
  return (
    <>
      <CommonTable columns={columns} data={data} loading={loading} />
      <FullPageLoader
        isLoading={
          deleteComment.isPending ||
          deleteReview.isPending ||
          deleteNotice.isPending
        }
      />
    </>
  );
}
