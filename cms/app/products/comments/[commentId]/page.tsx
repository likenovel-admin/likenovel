"use client";
import {
  useGetCommentDetail,
  useUpdateComment,
} from "@/api/reviewCommentNotice";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const params = useParams();
  const commentId = Array.isArray(params.commentId)
    ? params.commentId[0]
    : params.commentId;
  // const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const { data, isLoading, isFetching } = useGetCommentDetail(commentId || "");
  const updateReview = useUpdateComment();

  useEffect(() => {
    if (data) {
      // setTitle(data.content);
      setContent(data.content);
      setIsPublic(data.open_yn === "Y");
    }
  }, [data]);

  const handleCancel = () => {
    route.push("/products/review-comment-notice");
  };

  const handleUpdate = () => {
    if (updateReview.isPending) {
      return;
    }
    updateReview.mutate(
      {
        id: commentId || "",
        body: {
          content: content,
          open_yn: isPublic ? "Y" : "N",
          // display_top_yn: isPublic ? "Y" : "N",
        },
      },
      {
        onSuccess: () => {
          route.push("/products/review-comment-notice");
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      }
    );
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>댓글 정보</span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    취소
                  </Button>
                  <Button onClick={handleUpdate}>수정</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <hr />
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHead className="require">닉네임</TableHead>
                    <TableCell>{data?.nickname || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">이메일</TableHead>
                    <TableCell>{data?.email || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">이름</TableHead>
                    <TableCell>{data?.user_name || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">작성 대상</TableHead>
                    <TableCell>{data?.product_title || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">작성 일자</TableHead>
                    <TableCell>
                      {data?.created_date
                        ? format(new Date(data?.created_date), "yyyy-MM-dd")
                        : ""}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">댓글</TableHead>
                    <TableCell>
                      <Textarea
                        className="h-[100px]"
                        value={content || ""}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">공개 여부</TableHead>
                    <TableCell>
                      <Input
                        type="checkbox"
                        className="w-[36px]"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <FullPageLoader
          isLoading={updateReview.isPending || isLoading || isFetching}
        />
      </SidebarInset>
    </>
  );
}
