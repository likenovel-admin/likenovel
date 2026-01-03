"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/page-header";
import { useGetQuestDetail, useUpdateQuest } from "@/api/quest";
import {
  catchErrorMessage,
  isPositiveIntegerInput,
  showAlert,
} from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import FullPageLoader from "@/components/common/FullPageLoader";

const DAYS = [
  { label: "월요일", value: "MON" },
  { label: "화요일", value: "TUE" },
  { label: "수요일", value: "WED" },
  { label: "목요일", value: "THU" },
  { label: "금요일", value: "FRI" },
  { label: "토요일", value: "SAT" },
  { label: "일요일", value: "SUN" },
];
export default function Page() {
  // const isMobile = useIsMobile()
  const route = useRouter();
  const params = useParams();
  const questId = Array.isArray(params.questId)
    ? params.questId[0]
    : params.questId;
  const [refreshDays, setRefreshDays] = useState<string[]>([]);
  const [stepSettings, setStepSettings] = useState<boolean[]>([
    true,
    true,
    true,
  ]);
  const [steps, setSteps] = useState(
    Array.from({ length: 3 }).map(() => ({
      progressCount: "",
      rewardTicketCount: "",
    }))
  );

  const { data, isLoading, isFetching } = useGetQuestDetail(questId || "");
  const updateQuest = useUpdateQuest();

  useEffect(() => {
    if (data) {
      const activeDays = Object.entries(data.renewal)
        .filter(([_, val]) => val === "Y")
        .map(([day]) => day.toUpperCase());
      setRefreshDays(activeDays);

      setStepSettings([
        data.step1.useYn === "Y",
        data.step2.useYn === "Y",
        data.step3.useYn === "Y",
      ]);

      setSteps([
        {
          progressCount: data.step1.count_process + "",
          rewardTicketCount: data.step1.count_ticket + "",
        },
        {
          progressCount: data.step2.count_process + "",
          rewardTicketCount: data.step2.count_ticket + "",
        },
        {
          progressCount: data.step3.count_process + "",
          rewardTicketCount: data.step3.count_ticket + "",
        },
      ]);
    }
  }, [data]);

  const toggleRefreshDay = (value: string) => {
    setRefreshDays((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleStep = (index: number) => {
    const newSteps = [...stepSettings];
    newSteps[index] = !newSteps[index];
    setStepSettings(newSteps);
  };

  const handleStepInputChange = (
    index: number,
    field: "progressCount" | "rewardTicketCount",
    value: number
  ) => {
    const newSteps = [...steps];
    newSteps[index][field] = value + "";
    setSteps(newSteps);
  };

  const handleCancel = () => {
    route.push("/quests");
  };

  const handleUpdate = () => {
    if (updateQuest.isPending) {
      return;
    }
    if (refreshDays.length === 0) {
      return showAlert(
        "오류",
        "갱신 주기를 최소 1일 이상 선택해주세요.",
        "확인"
      );
    }

    for (let i = 0; i < stepSettings.length; i++) {
      if (stepSettings[i]) {
        const step = steps[i];
        if (
          !step.progressCount ||
          Number(step.progressCount || 0) < 1 ||
          !step.rewardTicketCount ||
          Number(step.rewardTicketCount || 0) < 1
        ) {
          return showAlert(
            "오류",
            `${i + 1}단계의 입력값이 올바르지 않습니다.`,
            "확인"
          );
        }
      }
    }
    updateQuest.mutate(
      {
        id: questId || "",
        body: {
          renewal: {
            MON: refreshDays.includes("MON") ? "Y" : "N",
            TUE: refreshDays.includes("TUE") ? "Y" : "N",
            WED: refreshDays.includes("WED") ? "Y" : "N",
            THU: refreshDays.includes("THU") ? "Y" : "N",
            FRI: refreshDays.includes("FRI") ? "Y" : "N",
            SAT: refreshDays.includes("SAT") ? "Y" : "N",
            SUN: refreshDays.includes("SUN") ? "Y" : "N",
          },
          step1: {
            useYn: stepSettings[0] ? "Y" : "N",
            count_process: Number(steps[0].progressCount),
            count_ticket: Number(steps[0].rewardTicketCount),
          },
          step2: {
            useYn: stepSettings[1] ? "Y" : "N",
            count_process: Number(steps[1].progressCount),
            count_ticket: Number(steps[1].rewardTicketCount),
          },
          step3: {
            useYn: stepSettings[2] ? "Y" : "N",
            count_process: Number(steps[2].progressCount),
            count_ticket: Number(steps[2].rewardTicketCount),
          },
        },
      },
      {
        onSuccess: () => {
          route.push("/quests");
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
        <PageHeader title="출석체크" />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <h1>출석체크</h1>
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
                    <TableHead className="require">갱신 주기</TableHead>
                    <TableCell className="flex gap-4">
                      {DAYS.map((item, index) => (
                        <label
                          key={item.value}
                          className="flex items-center gap-2"
                        >
                          <Input
                            type="checkbox"
                            checked={refreshDays.includes(item.value)}
                            onChange={() => toggleRefreshDay(item.value)}
                          />
                          <span className="text-nowrap">{item.label}</span>
                        </label>
                      ))}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableHead className="require">단계 설정</TableHead>
                    <TableCell className="flex gap-4">
                      {stepSettings.map((on, index) => (
                        <div
                          key={`step-${index}`}
                          className="flex items-center gap-2"
                        >
                          <Switch
                            checked={on}
                            onCheckedChange={() => toggleStep(index)}
                          />
                          {index + 1} 단계
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                  {steps.map((step, index) => (
                    <TableRow key={`step-row-${index}`}>
                      <TableHead className="require">{index + 1}단계</TableHead>
                      <TableCell className="flex gap-4">
                        <div>
                          <div>진행횟수</div>
                          <Input
                            // type="number"
                            value={step.progressCount}
                            disabled={!stepSettings[index]}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (
                                isPositiveIntegerInput(value) ||
                                value === ""
                              ) {
                                handleStepInputChange(
                                  index,
                                  "progressCount",
                                  Number(e.target.value)
                                );
                              }
                            }}
                          />
                        </div>
                        <div>
                          <div>보상 대여권 수</div>
                          <Input
                            // type="number"
                            value={step.rewardTicketCount}
                            disabled={!stepSettings[index]}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (
                                isPositiveIntegerInput(value) ||
                                value === ""
                              ) {
                                handleStepInputChange(
                                  index,
                                  "rewardTicketCount",
                                  Number(e.target.value)
                                );
                              }
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <FullPageLoader
          isLoading={isLoading || isFetching || updateQuest.isPending}
        />
      </SidebarInset>
    </>
  );
}
