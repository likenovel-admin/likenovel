import { useOpenNotice } from "@/app/api/query/author/episode";
import useToastStore from "@/store/toastStore";
import { INotice } from "@/types";
import { getFormattingDate } from "@/utils/getFormattingDate";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Button from "../common/Button";
import RoundBadge from "../common/RoundBadge";
import SimpleMenu from "../common/SimpleMenu";
import ArrowUpDown from "/public/images/arrow-up-down.svg";
import Write from "/public/images/write.svg";

interface NoticeTabProps {
  notices: INotice[];
}

const NoticeTab = ({ notices }: NoticeTabProps) => {
  const [isDescSort, setIsDescSort] = useState(true);

  const sortedNotices = useMemo(() => {
    const sorted = [...notices];

    if (isDescSort) {
      return sorted.sort(
        (a, b) =>
          new Date(b.updated_date).getTime() -
          new Date(a.updated_date).getTime()
      );
    } else {
      return sorted.sort(
        (a, b) =>
          new Date(a.updated_date).getTime() -
          new Date(b.updated_date).getTime()
      );
    }
  }, [notices, isDescSort]);

  return (
    <div>
      <Button
        variant="secondary"
        size="sm"
        className="w-[100px] md:w-[110px]"
        onClick={() => setIsDescSort(!isDescSort)}
      >
        <ArrowUpDown className="w-[11px] md:w-[13px] h-[12px]" />
        <span className="ml-5pxr text-12pxr md:text-14pxr text-dark-gray-500">
          {isDescSort ? "최신순" : "오래된순"}
        </span>
      </Button>
      <div className="border-t mt-4">
        {sortedNotices?.map((notice) => (
          <NoticeItem key={notice.noticeId} notice={notice} />
        ))}
      </div>
    </div>
  );
};
interface INoticeItemProps {
  notice: INotice;
}

const NoticeItem = ({ notice }: INoticeItemProps) => {
  const router = useRouter();
  const { setToast } = useToastStore();
  const queryClient = useQueryClient();
  const openNoticeMutation = useOpenNotice();

  const handleOpenEditNotice = () => {
    router.push(`/making-episode/${notice.product_id}/${notice.id}/notice`);
  };
  const handleToggleVisibility = async () => {
    if (openNoticeMutation.isPending) {
      return;
    }
    try {
      await openNoticeMutation.mutateAsync(
        { noticeId: notice.id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ["selectProductDetail", notice.product_id],
            });

            if (notice.open_yn === "Y") {
              setToast({
                message: "공지가 비공개로 변경되었습니다.",
                type: "success",
              });
            } else {
              setToast({
                message: "공지가 공개로 변경되었습니다.",
                type: "success",
              });
            }
          },
          onError: (error: any) => {
            setToast({
              message:
                error?.response?.data?.message ||
                "공지 상태 변경에 실패했습니다.",
              type: "error",
            });
          },
        }
      );
    } catch (error) {
      setToast({
        message: notice.open_yn
          ? "공지가 비공개로 변경되었습니다."
          : "공지 상태 변경에 실패했습니다.",
        type: "error",
      });
    }
  };

  const isScheduledRelease =
    notice.open_yn === "N" && notice.publish_reserve_date;
  return (
    <div className="py-3 border-b border-b-light-gray-100 flex flex-col">
      <div className="flex justify-between">
        <div className="flex gap-1 text-14pxr md:text-16pxr">
          {notice?.subject}
          <div className="flex gap-1">
            {isScheduledRelease && <RoundBadge type="reservation" />}
            {notice.open_yn === "N" && <RoundBadge type="private" />}
            {notice.open_yn === "Y" && <RoundBadge type="release" />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-light-gray-100"
            onClick={handleOpenEditNotice}
            aria-label={`공지 수정: ${notice.subject}`}
          >
            <Write className="h-[17px] w-[17px]" aria-hidden="true" />
          </button>
          <SimpleMenu
            menuList={[
              {
                title: "수정",
                onClick() {
                  handleOpenEditNotice();
                },
              },
              {
                title: notice.open_yn === "Y" ? "비공개" : "공개",
                onClick: handleToggleVisibility,
              },
            ]}
          />
        </div>
      </div>
      {notice.publish_reserve_date ? (
        <span className="text-primary-100 text-11pxr md:text-13pxr">
          {getFormattingDate(notice.publish_reserve_date, "YYYY.MM.DD HH:mm")}{" "}
          공개예정
        </span>
      ) : (
        <span className="text-dark-gray-400 text-11pxr md:text-13pxr">
          {getFormattingDate(notice.created_date, "YYYY.MM.DD")}
        </span>
      )}
    </div>
  );
};

export default NoticeTab;
