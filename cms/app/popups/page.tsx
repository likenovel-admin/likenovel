"use client";
import { useEditPopup, useGetPopupDetail } from "@/api/popup";
import { useCreateUpload, useUpdateUpload } from "@/api/upload";
import { FileUpload } from "@/components/common/FileUpload";
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
import { catchErrorMessage, getFileName, showAlert } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const pathname = usePathname();
  const [showYn, setShowYn] = useState<string>("show-y");
  const [url, setUrl] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);

  const tabs = [
    {
      label: "배너",
      value: "/banners",
    },
    {
      label: "팝업",
      value: "/popups",
    },
  ];

  const { data, isLoading, isFetching } = useGetPopupDetail();
  const updatePopup = useEditPopup();
  const createUpload = useCreateUpload();
  const updateUpload = useUpdateUpload();

  useEffect(() => {
    if (data) {
      setShowYn(data.use_yn === "Y" ? "show-y" : "show-n");
      setUrl(data.url);
    }
  }, [data]);

  const handleSubmit = async () => {
    if (
      updatePopup.isPending ||
      createUpload.isPending ||
      updateUpload.isPending
    ) {
      return;
    }
    // Validation
    if (url && !/^https?:\/\/.+/i.test(url)) {
      showAlert("알림", "올바른 URL 형식을 입력해주세요.", "확인");
      return;
    }

    // Validate image
    if (!image && !data?.image_id) {
      showAlert("알림", "팝업 이미지를 업로드해주세요.", "확인");
      return;
    }

    // start upload
    let imageId = data?.image_id || null;
    if (image) {
      const res = await createUpload.mutateAsync(
        {
          group_type: "user",
          file_name: getFileName(image),
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        }
      );
      console.log("res", res);
      const formData = new FormData();
      formData.append("file", image);
      await updateUpload.mutateAsync(
        {
          url: res.data.uploadPath,
          // file: formData,
          file: image,
          file_type: image.type,
        },
        {
          onError: (err) => showAlert("오류", catchErrorMessage(err), "확인"),
        }
      );
      imageId = res.data.fileId;
    }

    updatePopup.mutate(
      {
        use_yn: showYn === "show-y" ? "Y" : "N",
        url: url,
        image_id: imageId || undefined,
      },
      {
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
          <span>배너 및 팝업 관리</span>
          <div className="flex items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2 px-4">
              {tabs.map((item, index) => (
                <Button
                  key={`tab-${index}`}
                  variant={pathname == item.value ? "default" : "outline"}
                  onClick={() => route.push(item.value)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>팝업 관리</span>
                <div>
                  <Button onClick={handleSubmit}>수정</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <hr />
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHead className="require">노출 여부</TableHead>
                    <TableCell className="flex gap-4">
                      {[
                        { label: "노출", id: "show-y" },
                        { label: "미노출", id: "show-n" },
                      ].map((item, index) => (
                        <label
                          key={`radio-${item.id}`}
                          htmlFor={item.id}
                          className="flex items-center gap-2"
                        >
                          <Input
                            type="radio"
                            name="show-yn"
                            id={item.id}
                            checked={showYn === item.id}
                            onChange={() => setShowYn(item.id)}
                          />
                          <div className="whitespace-nowrap">{item.label}</div>
                        </label>
                      ))}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">URL</TableHead>
                    <TableCell>
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">팝업 이미지</TableHead>
                    <TableCell>
                      <FileUpload
                        fileName={getFileName(
                          image || "",
                          data?.image_filename
                        )}
                        onFileChange={setImage}
                      />
                      <br />
                      PC: 1080x347 (1120x360), 포멧: jpg|png|gif
                    </TableCell>
                  </TableRow>
                  {(image || data?.image_path) && (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <img
                          src={
                            image
                              ? URL.createObjectURL(image)
                              : data?.image_path || ""
                          }
                          alt="배너 미리보기"
                          className="max-h-[180px] rounded border"
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <FullPageLoader
          isLoading={
            isLoading ||
            isFetching ||
            updatePopup.isPending ||
            createUpload.isPending ||
            updateUpload.isPending
          }
        />
      </SidebarInset>
    </>
  );
}
