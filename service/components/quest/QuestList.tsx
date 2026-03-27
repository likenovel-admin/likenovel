import { useReceiveQuestRewards, useSelectQuest } from "@/app/api/query/quest";
import useAuthStore from "@/store/authStore";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import {
  getLocalStorage,
  removeLocalStorage,
  setLocalStorage,
  STORAGE_KEYS,
} from "@/utils/localStorage";
import ExclamationTooltip from "../common/ExclamationTooltip";
import Spinner from "../common/Spinner";
import ProgressBar from "./ProgressBar";

const formatRemainingTime = () => {
  const now = new Date();

  // Calculate time until midnight (00:00 of next day)
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Set to 00:00 of next day

  const diff = midnight.getTime() - now.getTime();

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return (
    <>
      갱신까지{" "}
      <span className="text-primary-100">
        {String(hours).padStart(2, "0")}시간 {String(minutes).padStart(2, "0")}
        분 {String(seconds).padStart(2, "0")}초
      </span>{" "}
      남음
    </>
  );
};

const QuestList = () => {
  const { isAuthenticated, isAuthInitialized } = useAuthStore();
  const { data, isLoading, refetch } = useSelectQuest(
    isAuthInitialized,
    isAuthenticated
  );
  const receiveReward = useReceiveQuestRewards();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const hasTriggeredPendingRewardRef = useRef(false);

  const questList = data?.data ?? [];
  const pendingQuestReward = useMemo(
    () =>
      getLocalStorage<{ questId: number; rewardId: number }>(
        STORAGE_KEYS.QUEST_REWARD_AFTER_LOGIN
      ),
    [isAuthenticated, isAuthInitialized]
  );

  const handleReceiveReward = (questId: number, rewardId: number) => {
    if (receiveReward.isPending) {
      return;
    }
    receiveReward.mutate(
      { quest_id: questId, reward_id: rewardId },
      {
        onSuccess: () => {
          setToast({
            message: "보상을 받았습니다!",
            type: "success",
          });
          refetch();

          // Invalidate user info query to update ticket count in GlobalMenu
          queryClient.invalidateQueries({
            queryKey: ["selectUserInfo"],
          });
        },
        onError: (error: any) => {
          setToast({
            message:
              error?.response?.data?.message ||
              "보상 받기에 실패했습니다. 다시 시도해주세요.",
            type: "error",
          });
        },
      }
    );
  };

  const handleGuestAttendanceReward = (questId: number, rewardId: number) => {
    setLocalStorage(STORAGE_KEYS.QUEST_REWARD_AFTER_LOGIN, {
      questId,
      rewardId,
    });
    setLocalStorage(
      STORAGE_KEYS.PREVIOUS_PAGE,
      window.location.pathname + window.location.search
    );
    router.push("/login?modal=open", { scroll: false });
  };

  useEffect(() => {
    if (!isAuthInitialized || !isAuthenticated) return;
    if (hasTriggeredPendingRewardRef.current) return;
    if (!pendingQuestReward) return;
    if (receiveReward.isPending) return;

    const targetQuest = questList.find(
      (quest) => quest.quest_id === pendingQuestReward.questId
    );

    if (!targetQuest) return;

    if (targetQuest.reward_own_yn === "Y") {
      hasTriggeredPendingRewardRef.current = true;
      removeLocalStorage(STORAGE_KEYS.QUEST_REWARD_AFTER_LOGIN);
      return;
    }

    const isTargetCompleted =
      targetQuest.progress.current_process >=
        targetQuest.current_stage.count_process &&
      targetQuest.reward_own_yn === "N";

    if (!isTargetCompleted) return;

    hasTriggeredPendingRewardRef.current = true;
    removeLocalStorage(STORAGE_KEYS.QUEST_REWARD_AFTER_LOGIN);
    handleReceiveReward(pendingQuestReward.questId, pendingQuestReward.rewardId);
  }, [
    isAuthInitialized,
    isAuthenticated,
    pendingQuestReward,
    questList,
    receiveReward.isPending,
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-col md:bg-white md:w-[630px] md:rounded-2xl md:border md:p-3 md:rounded-b-none min-h-[200px] justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:bg-white md:w-[630px] md:rounded-2xl md:border md:p-3 md:rounded-b-none">
      {data?.data?.map((quest, index) => {
        const isCompleted =
          quest.progress.current_process >= quest.current_stage.count_process &&
          quest.reward_own_yn === "N";
        const canGuestClaimAttendance = !isAuthenticated && quest.quest_id === 1;
        const canClickReward = isCompleted || canGuestClaimAttendance;

        return (
          <div
            key={quest.quest_id}
            className={`mb-2 px-4 py-3 border-b border-gray-100 bg-white ${
              index === data.data.length - 1 ? "md:border-none" : ""
            }`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{quest.title}</span>
                      <ExclamationTooltip message="퀘스트는 매일 00시에 갱신되며, 진행 조건을 충족하면 보상을 받을 수 있습니다." />
                    </div>

                    <button
                      onClick={() => {
                        if (canGuestClaimAttendance) {
                          handleGuestAttendanceReward(
                            quest.quest_id,
                            quest.reward_id
                          );
                          return;
                        }

                        handleReceiveReward(quest.quest_id, quest.reward_id);
                      }}
                      disabled={!canClickReward || receiveReward.isPending}
                      className={`w-m px-2.5 py-1.5 rounded-full text-sm transition-colors disabled:cursor-not-allowed
                        ${
                          canClickReward
                            ? "bg-black text-white hover:bg-gray-800 cursor-pointer"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                    >
                      보상받기
                    </button>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="flex items-center gap-5pxr">
                      <Image
                        src="/images/discount.svg"
                        alt="할인"
                        width={16}
                        height={14}
                        className="md:ml-2"
                      />
                      대여권 {quest.current_stage.count_ticket}장
                      <span className="text-gray-100 text-xs mx-1 mt-0.5">
                        |
                      </span>
                    </span>
                    <span className="text-gray-400">
                      {formatRemainingTime()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-5">
                <ProgressBar
                  current={quest.progress.current_process}
                  max={quest.current_stage.count_process}
                  index={index}
                />
                <div className="text-right text-gray-400 mt-1">
                  <span className="text-primary-100 font-bold">
                    {quest.progress.current_process}
                  </span>
                  /{quest.current_stage.count_process}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuestList;
