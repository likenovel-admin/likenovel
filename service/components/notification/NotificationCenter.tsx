"use client";

import { instance } from "@/app/api/axios";
import { useUserAlarmsMarkAsRead } from "@/app/api/query/mypage/user";
import notificationDefault from "@/public/images/notification-default.png";
import useAlarmStore from "@/store/alarmStore";
import useConfirmStore from "@/store/confirmStore";
import useModalStore from "@/store/modalStore";
import useToastStore from "@/store/toastStore";
import { getUser } from "@/utils/getUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState } from "react";

interface INotification {
  id: number;
  title?: string;
  author?: boolean;
  content: string;
  createdAt: string;
  profileImage?: string;
  readYn: "Y" | "N";
}

const NotificationCenter = () => {
  const [showAll, setShowAll] = useState(false);
  const user = getUser();
  const { setToast } = useToastStore();
  const { setConfirm } = useConfirmStore();
  const { setModal } = useModalStore();
  const queryClient = useQueryClient();
  const { setHasNew } = useAlarmStore();
  const { mutateAsync: userAlarmsMarkAsRead } = useUserAlarmsMarkAsRead() ?? {};
  const { data: notifications } = useQuery<INotification[]>({
    queryKey: ["notifications", user?.userId],
    queryFn: async () => {
      const response = await instance.get("/v1/query/user/alarms");
      return response.data.data;
    },
    enabled: !!user,
  });

  const displayedNotifications = notifications?.slice().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const unreadNotifications = notifications?.filter(
    (item) => item.readYn === "N"
  );
  const unreadCount = unreadNotifications?.length ?? 0;

  // Update hasNew when notifications data changes
  useEffect(() => {
    if (notifications) {
      const unreadCount = notifications.filter(
        (item) => item.readYn === "N"
      ).length;
      setHasNew(unreadCount > 0);
    }
  }, [notifications, setHasNew]);

  const handleAllReadConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();

    const handleAllReadResult = async () => {
      try {
        await userAlarmsMarkAsRead();
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        setToast({
          message: "모든 알림을 읽음 처리했습니다.",
          type: "success",
        });
      } catch (error) {
        setToast({
          message: "알림 읽음 처리에 실패했습니다.",
          type: "error",
        });
      }
    };

    setConfirm({
      content: (
        <div className="flex flex-col gap-[5px]">
          <span className="text-15pxr md:text-18pxr font-bold text-center">
            모든 알림을 읽음 처리하시겠습니까?
          </span>
        </div>
      ),
      onConfirm: () => handleAllReadResult(),
      confirmText: "알림 읽음",
    });
  };

  return (
    <div className="w-full h-full bg-white md:p-16pxr md:relative md:max-w-[1080px] md:mx-auto">
      <header
        className="flex justify-between px-16pxr py-12pxr border-b border-light-gray-300 
        md:px-0 md:py-16pxr"
      >
        <button className="md:hidden p-8pxr ">
          <Image
            src="/images/arrow-left.svg"
            width={8}
            height={8}
            alt="뒤로가기"
          />
        </button>
        <div className="flex flex-col gap-4pxr">
          <h1 className="text-16pxr text-center font-bold flex-1 absolute left-1/2 -translate-x-1/2 md:static md:text-left md:left-0 md:translate-x-0 md:text-xl">
            알림센터
          </h1>
          <div className="hidden md:flex text-14pxr justify-between text-dark-gray-400">
            <span>
              읽지 않은 알림{" "}
              <span className="text-primary-100 font-bold">{unreadCount}</span>{" "}
              최근 한달간 알림 내역
            </span>
          </div>
        </div>
        <button
          className="flex items-center gap-4pxr text-14pxr text-dark-gray-400"
          onClick={(e) => {
            handleAllReadConfirm(e);
          }}
        >
          모두 읽음 처리
          <div className="flex items-center justify-center border rounded-full w-[20px] h-[20px]">
            <Image
              src="/images/check-circle.svg"
              width={14}
              height={14}
              alt="모두 읽음 처리"
            />
          </div>
        </button>
      </header>
      <div className="flex text-14pxr justify-between px-20pxr py-12pxr text-dark-gray-400 md:hidden">
        <span>
          읽지 않은 알림{" "}
          <span className="text-primary-100 font-bold">{unreadCount}</span> 최근
          한달간 알림 내역
        </span>
      </div>

      <div className="flex flex-col -mt-10pxr md:gap-5pxr md:mt-16pxr">
        {displayedNotifications?.length && displayedNotifications.length > 0 ? (
          displayedNotifications.map((notification, index) => (
            <NotificationItem key={index} {...notification} />
          ))
        ) : (
          <div className="flex justify-center items-center py-40pxr text-dark-gray-400">
            알림이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationItem = ({
  title,
  author,
  content,
  createdAt,
  profileImage,
}: INotification) => {
  return (
    <div className="flex px-20pxr gap-14pxr items-start py-20pxr md:rounded-[10px] md:my-5pxr md:px-16pxr md:py-16pxr md:border md:border-light-gray-300 md:items-center">
      <div className="relative w-[48px] h-[48px]">
        {profileImage ? (
          <Image
            src={profileImage}
            alt="알림 이미지"
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <Image
            src={notificationDefault}
            alt="알림 이미지"
            fill
            className="rounded-full object-contain p-[8px] bg-white border border-light-gray-300 md:border-none"
          />
        )}
      </div>
      <div className="flex flex-col gap-5pxr flex-1 break-keep relative md:flex-row md:items-center md:justify-between">
        <div className="text-15pxr">
          <span className="font-bold mr-3pxr">{title}</span>
          {author && <span className="font-bold">작가</span>}
          <span className="text-dark-gray-400"> {content}</span>
        </div>
        <span className="text-11pxr text-dark-gray-400">{createdAt}</span>
        <div className="absolute right-0 bottom-[-20px] w-full h-[1px] bg-light-gray-300 md:hidden" />
      </div>
    </div>
  );
};

export default NotificationCenter;
