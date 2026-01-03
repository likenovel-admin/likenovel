"use client";
import {
  useSelectUserNotificationSettings,
  useUpdateUserNotificationSettings,
} from "@/app/api/query/mypage/user";
import Spinner from "@/components/common/Spinner";
import Toggle from "@/components/form/toggle";
import useToastStore from "@/store/toastStore";
import { useQueryClient } from "@tanstack/react-query";

const Page = () => {
  const queryClient = useQueryClient();
  const { setToast } = useToastStore();
  const { data: notificationSettings, isLoading } =
    useSelectUserNotificationSettings();
  const updateSettings = useUpdateUserNotificationSettings();

  const handleToggle = async (
    field: "benefit" | "comment" | "system" | "event" | "marketing",
    currentValue: "Y" | "N"
  ) => {
    if (updateSettings.isPending) return;
    const newValue = currentValue === "Y" ? "N" : "Y";
    try {
      await updateSettings.mutateAsync({ [field]: newValue });
      // Invalidate and refetch notification settings
      queryClient.invalidateQueries({
        queryKey: ["selectUserNotificationSettings"],
      });
      setToast({
        type: "success",
        message: "알림 설정이 변경되었습니다.",
      });
    } catch (error) {
      console.error("Failed to update notification settings:", error);
      setToast({
        type: "error",
        message: "알림 설정 변경에 실패했습니다.",
      });
    }
  };

  const settings = notificationSettings?.data;

  return (
    <div className="pt-[30px] px-4 pb-[10px] md:pt-11 md:pb-8 flex md:items-center flex-col md:w-[555px] md:mx-auto">
      <span className="text-18pxr md:text-24pxr font-semibold pb-[10px] md:pb-8">
        알림설정
      </span>
      {isLoading ? (
        <Spinner />
      ) : (
        <ul className="md:w-[550px] border rounded-2xl">
          {/* Hidden: 혜택정보 알림 */}
          {/* <li className="text-16pxr flex font-medium justify-between md:p-5 md:pl-7 p-4 pl-5 items-center">
            <span>혜택정보 알림</span>
            <Toggle
              disabled={updateSettings.isPending}
              checked={settings?.benefit === "Y"}
              onChange={() => handleToggle("benefit", settings?.benefit || "N")}
            />
          </li> */}
          <li className="text-16pxr flex font-medium justify-between md:p-5 md:pl-7 p-4 pl-5 items-center">
            <span>댓글 알림</span>
            <Toggle
              disabled={updateSettings.isPending}
              checked={settings?.comment === "Y"}
              onChange={() => handleToggle("comment", settings?.comment || "N")}
            />
          </li>
          {/* Hidden: 시스템 알림 */}
          {/* <li className="text-16pxr flex font-medium justify-between md:p-5 md:pl-7 p-4 pl-5 items-center border-t">
            <span>시스템 알림</span>
            <Toggle
              disabled={updateSettings.isPending}
              checked={settings?.system === "Y"}
              onChange={() => handleToggle("system", settings?.system || "N")}
            />
          </li> */}
          {/* Hidden: 이벤트 알림 */}
          {/* <li className="text-16pxr flex font-medium justify-between md:p-5 md:pl-7 p-4 pl-5 items-center border-t">
            <span>이벤트 알림</span>
            <Toggle
              disabled={updateSettings.isPending}
              checked={settings?.event === "Y"}
              onChange={() => handleToggle("event", settings?.event || "N")}
            />
          </li> */}
          <li className="text-16pxr flex font-medium justify-between md:p-5 md:pl-7 p-4 pl-5 items-center border-t">
            <span>마케팅 정보 수신동의</span>
            <Toggle
              disabled={updateSettings.isPending}
              checked={settings?.marketing === "Y"}
              onChange={() =>
                handleToggle("marketing", settings?.marketing || "N")
              }
            />
          </li>
        </ul>
      )}
    </div>
  );
};

export default Page;
