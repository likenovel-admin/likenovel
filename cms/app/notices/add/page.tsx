"use client";
import { useAddNotice } from "@/api/notice";
import { useCreateUpload, useUpdateUpload } from "@/api/upload";
import { Editor } from "@/components/common/Editor";
import { FileUpload } from "@/components/common/FileUpload";
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
import { catchErrorMessage, getFileName, showAlert } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [primary, setPrimary] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const addNotice = useAddNotice();
  const createUpload = useCreateUpload();
  const updateUpload = useUpdateUpload();

  const handleSubmit = async () => {
    if (addNotice.isPending || updateUpload.isPending || createUpload.isPending)
      return;
    if (!title.trim()) {
      return showAlert("알림", "제목을 입력해주세요.", "확인");
    }

    if (!content.trim()) {
      return showAlert("알림", "본문을 입력해주세요.", "확인");
    }

    // start upload
    let attachmentId = null;
    if (attachment) {
      const res = await createUpload.mutateAsync(
        {
          group_type: "user",
          file_name: getFileName(attachment),
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        }
      );
      console.log("res", res);
      const formData = new FormData();
      formData.append("file", attachment);
      await updateUpload.mutateAsync(
        {
          url: res.data.uploadPath,
          // file: formData,
          file: attachment,
          file_type: attachment.type,
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        }
      );
      attachmentId = res.data.fileId;
    }

    addNotice.mutate(
      {
        subject: title,
        content: content,
        primary_yn: primary ? "Y" : "N",
        file_id: attachmentId || undefined,
      },
      {
        onSuccess: () => {
          route.push("/notices");
        },
        onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
      }
    );
  };

  const handleCancel = () => {
    route.push("/notices");
  };

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex justify-between">
            <span>공지 등록</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                취소
              </Button>
              <Button onClick={handleSubmit}>등록</Button>
            </div>
          </div>
          <hr />
          <div className="flex items-center gap-2">
            <Input
              type="checkbox"
              id="is-fixed"
              className="w-[20px]"
              checked={primary}
              onChange={(e) => setPrimary(e.target.checked)}
            />
            <label htmlFor="is-fixed">게시판을 게시판 상단에 고정합니다.</label>
          </div>
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
                    preservePlainTextNewlines
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="require">첨부 파일</TableHead>
                <TableCell>
                  {/* <Input
                    type="file"
                    onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                  /> */}
                  <FileUpload
                    fileName={getFileName(attachment || "", "")}
                    onFileChange={setAttachment}
                    accept=""
                  />
                </TableCell>
              </TableRow>
              {attachment && (
                <TableRow>
                  <TableCell colSpan={2}>
                    {attachment && attachment.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(attachment)}
                        alt="배너 미리보기"
                        className="max-h-[180px] rounded border"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>📄 첨부파일: {attachment?.name}</span>
                        {attachment ? (
                          <a
                            href={URL.createObjectURL(attachment)}
                            download={attachment.name}
                            className="text-blue-500 underline"
                          >
                            다운로드
                          </a>
                        ) : null}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <FullPageLoader
          isLoading={
            addNotice.isPending ||
            updateUpload.isPending ||
            createUpload.isPending
          }
        />
      </SidebarInset>
    </>
  );
}
