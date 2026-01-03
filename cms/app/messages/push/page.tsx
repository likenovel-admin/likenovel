"use client";
import {
  useGetPushTemplate,
  useOffPush,
  useOnPush,
  useSendPush,
} from "@/api/push";
import FullPageLoader from "@/components/common/FullPageLoader";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { SidebarInset } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "template";
  const [contents, setContents] = useState("");

  const tabs = [
    {
      label: "템플릿",
      value: "template",
    },
    {
      label: "직접 발송",
      value: "direct",
    },
  ];

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetPushTemplate();
  const onPush = useOnPush();
  const offPush = useOffPush();
  const sendPush = useSendPush();

  const handleOnOfTemplate = (isOn: boolean, id: string) => {
    if (onPush.isPending || offPush.isPending) return;
    if (isOn) {
      offPush.mutate(id, {
        onSuccess: () => {
          refetch();
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      });
    } else {
      onPush.mutate(id, {
        onSuccess: () => {
          refetch();
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      });
    }
    refetch();
  };

  const handleSendPush = () => {
    if (sendPush.isPending) return;

    sendPush.mutate(
      {
        content: contents,
        title: "푸시 메시지",
        noti_type: "notification",
      },
      {
        onSuccess: () => {
          setContents("");
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
        <PageHeader title="푸시 메시지 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center gap-2 px-4">
            {tabs.map((item, index) => (
              <Button
                key={`tab-${index}`}
                variant={tab == item.value ? "default" : "outline"}
                onClick={() => route.push(`/messages/push?tab=${item.value}`)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          {tab == "template" && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>알림 템플릿</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.results || []).map((item, index) => (
                  <TableRow key={`row-${index}`}>
                    <TableCell className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="airplane-mode"
                          checked={item.use_yn === "Y"}
                          onCheckedChange={() =>
                            handleOnOfTemplate(
                              item.use_yn === "Y",
                              item.id + ""
                            )
                          }
                        />
                        {item.name}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => route.push(`/messages/push/${item.id}`)}
                      >
                        관리
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {tab == "direct" && (
            <>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableHead className="require">이미지</TableHead>
                    <TableCell>라이크노벨 이미지</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">본문</TableHead>
                    <TableCell>
                      <Textarea
                        className="h-[100px]"
                        value={contents}
                        onChange={(e) => setContents(e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="flex items-center justify-center">
                <Button onClick={handleSendPush}>발송하기</Button>
              </div>
            </>
          )}
        </div>
        <FullPageLoader
          isLoading={
            isLoadingData ||
            isFetching ||
            onPush.isPending ||
            offPush.isPending ||
            sendPush.isPending
          }
        />
      </SidebarInset>
    </>
  );
}

export default function SuspensePage() {
  return (
    <Suspense>
      <Page />
    </Suspense>
  );
}
