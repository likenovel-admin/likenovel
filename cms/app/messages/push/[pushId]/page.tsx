"use client";
import { useGetPushTemplateDetail, useUpdateTemplatePush } from "@/api/push";
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
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { on } from "events";
import FullPageLoader from "@/components/common/FullPageLoader";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const params = useParams();
  const pushId = Array.isArray(params.pushId)
    ? params.pushId[0]
    : params.pushId;
  const [content, setContent] = useState("");

  const { data, isLoading, isFetching } = useGetPushTemplateDetail(
    pushId || ""
  );
  const updateTemplate = useUpdateTemplatePush();

  useEffect(() => {
    if (data) {
      // setTitle(data.content);
      setContent(data.contents);
      // setIsPublic(data.data.is_public);
    }
  }, [data]);

  const handleCancel = () => {
    route.push("/messages/push");
  };

  const handleUpdate = () => {
    if (updateTemplate.isPending) {
      return;
    }
    updateTemplate.mutate(
      {
        id: pushId || "",
        body: {
          contents: content,
        },
      },
      {
        onSuccess: () => {
          route.push("/messages/push");
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
                <span>템플릿 정보</span>
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
                    <TableHead className="require">템플릿명</TableHead>
                    <TableCell>{data?.name || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">발송 조건</TableHead>
                    <TableCell>{data?.condition || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">랜딩 페이지</TableHead>
                    <TableCell>{data?.landing_page || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">이미지</TableHead>
                    <TableCell>{data?.image_id || ""}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">본문</TableHead>
                    <TableCell>
                      <Textarea
                        className="h-[100px]"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <FullPageLoader
          isLoading={isLoading || isFetching || updateTemplate.isPending}
        />
      </SidebarInset>
    </>
  );
}
