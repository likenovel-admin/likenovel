"use client";
import { useGetQuests, useOffQuest, useOnQuest } from "@/api/quest";
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
import { catchErrorMessage, showAlert } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();

  const {
    data,
    refetch,
    isLoading: isLoadingData,
    isFetching,
  } = useGetQuests();
  const onQuest = useOnQuest();
  const offQuest = useOffQuest();

  const handleOnOfQuest = (isOn: boolean, id: string) => {
    if (onQuest.isPending || offQuest.isPending) return;
    if (isOn) {
      offQuest.mutate(id, {
        onSuccess: () => {
          refetch();
        },
        onError: (err: any) => {
          showAlert("오류", catchErrorMessage(err), "확인");
        },
      });
    } else {
      onQuest.mutate(id, {
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

  return (
    <>
      {/*{isMobile && <SidebarTrigger />}*/}
      <SidebarInset className="bg-sidebar-inset-background">
        <PageHeader title="퀘스트 관리" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>퀘스트 종류</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.data || []).map((item, index) => (
                <TableRow key={`row-${index}`}>
                  <TableCell className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="airplane-mode"
                        checked={item.use_yn === "Y"}
                        onCheckedChange={() =>
                          handleOnOfQuest(
                            item.use_yn === "Y",
                            item.quest_id + ""
                          )
                        }
                      />
                      {item.title}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => route.push(`/quests/${item.quest_id}`)}
                    >
                      관리
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <FullPageLoader
          isLoading={
            isLoadingData ||
            isFetching ||
            onQuest.isPending ||
            offQuest.isPending
          }
        />
      </SidebarInset>
    </>
  );
}
