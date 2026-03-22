"use client";
import { Editor } from "@/components/common/Editor";
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAddFaq } from "@/api/faq";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import FullPageLoader from "@/components/common/FullPageLoader";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const addFaq = useAddFaq();

  const handleSubmit = () => {
    if (addFaq.isPending) return;
    if (!title.trim()) {
      return showAlert("알림", "제목을 입력해주세요.", "확인");
    }

    if (!content.trim()) {
      return showAlert("알림", "본문을 입력해주세요.", "확인");
    }
    addFaq.mutate(
      {
        subject: title,
        content: content,
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
            <span>FAQ 등록</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                취소
              </Button>
              <Button onClick={handleSubmit}>등록</Button>
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
                    preservePlainTextNewlines
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <FullPageLoader isLoading={addFaq.isPending} />
      </SidebarInset>
    </>
  );
}
