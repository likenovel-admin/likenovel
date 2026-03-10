"use client";

import { instance } from "@/app/api/axios";
import notificationDefault from "@/public/images/notification-default.png";
import useAlarmStore from "@/store/alarmStore";
import useAuthStore from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

const NotificationList = () => {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const { accessToken, user, isAuthenticated } = useAuthStore((state) => ({
    accessToken: state.accessToken,
    user: state.user,
    isAuthenticated: state.isAuthenticated,
  }));
  const canUseUserScope = !!accessToken && !!user?.userId && isAuthenticated;
  const { setHasNew } = useAlarmStore();
  const { data: notifications } = useQuery<INotification[]>({
    queryKey: ["notifications", user?.userId],
    queryFn: async () => {
      const response = await instance.get("/v1/query/user/alarms");
      return response.data.data;
    },
    enabled: canUseUserScope,
  });

  const sortedNotifications = notifications?.slice().sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const displayedNotifications = showAll
    ? sortedNotifications
    : sortedNotifications?.slice(0, 4);

  const unreadNotifications = notifications?.filter(
    (item) => item.readYn === "N"
  );
  const unreadCount = unreadNotifications?.length ?? 0;

  // Update hasNew when notifications data changes
  useEffect(() => {
    if (!canUseUserScope) {
      setHasNew(false);
      return;
    }
    if (notifications) {
      const unreadCount = notifications.filter(
        (item) => item.readYn === "N"
      ).length;
      console.log("unreadCount list from useEffect", unreadCount);
      setHasNew(unreadCount > 0);
    }
  }, [canUseUserScope, notifications, setHasNew]);

  return (
    <div className="w-full min-h-[120px] flex flex-col">
      <div className="text-14pxr px-20pxr py-15pxr text-dark-gray-400 border-b border-light-gray-300">
        읽지 않은 알림{" "}
        <span className="text-primary-100 font-bold">{unreadCount}</span> 최근
        한달간 알림 내역
      </div>
      <div className="flex flex-col">
        {displayedNotifications?.length ? (
          displayedNotifications.map((notification, index) => (
            <div
              key={index}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => router.push("/product/notification")}
            >
              <NotificationItem {...notification} />
            </div>
          ))
        ) : (
          <div className="flex justify-center items-center py-40pxr text-dark-gray-400">
            알림이 없습니다.
          </div>
        )}
        {!showAll && notifications?.length! > 3 && (
          <div className="px-20pxr py-10pxr">
            <button
              onClick={() => router.push("/product/notification")}
              className="w-full text-15pxr text-primary-100"
            >
              알림 더보기
            </button>
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
    <div className="flex gap-14pxr items-start px-20pxr py-20pxr border-b border-light-gray-300">
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
            className="rounded-full object-contain p-[8px] bg-white border border-light-gray-300"
          />
        )}
      </div>
      <div className="flex flex-col gap-5pxr flex-1 break-keep">
        <div className="text-15pxr">
          <span className="font-bold mr-3pxr">{title}</span>
          {author && <span className="font-bold">작가</span>}
          <span className="text-dark-gray-400"> {content}</span>
        </div>
        <span className="text-11pxr text-dark-gray-400">{createdAt}</span>
      </div>
    </div>
  );
};

export default NotificationList;
