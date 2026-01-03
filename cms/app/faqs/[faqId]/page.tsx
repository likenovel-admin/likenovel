"use client";
import { useEditFaq, useGetFaqDetail } from "@/api/faq";
import { Editor } from "@/components/common/Editor";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
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
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const params = useParams();
  const faqId = Array.isArray(params.faqId) ? params.faqId[0] : params.faqId;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data, isLoading, isFetching } = useGetFaqDetail(faqId || "");
  const updateFaq = useEditFaq();

  useEffect(() => {
    if (data) {
      setTitle(data.subject);
      setContent(data.content);
    }
  }, [data]);

  const handleSubmit = () => {
    if (updateFaq.isPending) return;
    if (!title.trim()) {
      return showAlert("알림", "제목을 입력해주세요.", "확인");
    }

    if (!content.trim()) {
      return showAlert("알림", "본문을 입력해주세요.", "확인");
    }
    updateFaq.mutate(
      {
        id: faqId || "",
        body: {
          subject: title,
          content: content,
        },
      },
      {
        onSuccess: () => {
          route.push("/faqs");
        },
        onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
      }
    );
  };

  const handleCancel = () => {
    route.push("/faqs");
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex justify-between">
            <span>FAQ 수정</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                취소
              </Button>
              <Button onClick={handleSubmit}>수정</Button>
            </div>
          </div>
          <hr />
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="require">제목</TableHead>
                <TableCell>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">본문</TableHead>
                <TableCell>
                  <Editor
                    value={content}
                    setValue={setContent}
                    placeholder="FAQ 본문 내용을 입력해주세요."
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <FullPageLoader
          isLoading={updateFaq.isPending || isFetching || isLoading}
        />
      </SidebarInset>
    </>
  );
}
