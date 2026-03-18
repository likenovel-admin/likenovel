import useNoticeStore from "@/store/noticeStore";
import { INotice } from "@/types";
import { getFormattingDate } from "@/utils/getFormattingDate";
import { buildViewerPath } from "@/utils/viewerPath";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MoreReadButton from "../common/MoreReadButton";
import Arrow from "/public/images/arrow-right-medium.svg";

interface Props {
  notices: INotice[];
  productId?: number | string;
  productTitle?: string;
}

const ProductNotice = ({
  notices,
  productTitle,
  productId,
}: Props) => {
  const router = useRouter();
  const { setNoticeData } = useNoticeStore();
  const [showAll, setShowAll] = useState(false);

  const sortedNotices = notices.sort(
    (a, b) =>
      new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime()
  );

  const displayedNotices = showAll ? sortedNotices : sortedNotices.slice(0, 3);

  const handleNoticeClick = (notice: INotice) => {
    setNoticeData(notice, productTitle || "");
    router.push(
      buildViewerPath(notice.id, {
        productId,
        type: "notice",
        title: productTitle || undefined,
      })
    );
  };

  return (
    <div className="relative w-full min-h-[60px] md:min-h-[80px] border border-light-gray-300 rounded-[10px] shadow-md">
      <div className="absolute top-[18px] left-[15px]">
        <Image
          src={"/images/notice.svg"}
          width={20}
          height={22}
          alt="공지사항"
        />
      </div>
      <div className="relative flex flex-col">
        {sortedNotices.length >= 1 ? (
          <>
            {displayedNotices.map((notice) => (
              <div
                key={notice.noticeId}
                className={`flex items-center justify-between w-full pl-50pxr py-10pxr md:py-15pxr ${
                  sortedNotices.length === 1 ? "" : "border-b"
                } border-light-gray-300 cursor-pointer`}
                onClick={() => handleNoticeClick(notice)}
              >
                <div className="flex flex-col gap-3pxr">
                  <span className="text-13pxr md:text-16pxr font-medium">
                    {notice.subject}
                  </span>
                  <span className="text-11pxr md:text-12pxr text-dark-gray-400">
                    {getFormattingDate(notice.updated_date, "YYYY.MM.DD")}
                  </span>
                </div>
                <Arrow className="w-[5px] h-[8px] mr-20pxr" />
              </div>
            ))}
            {!showAll && sortedNotices.length > 3 && (
              <div className="my-10pxr ml-5pxr">
                <MoreReadButton onClick={() => setShowAll(true)} />
              </div>
            )}
          </>
        ) : (
          <div className="absolute top-[15px] left-[45px]">
            <span className="text-13pxr md:text-16pxr font-medium">
              공지사항이 없습니다.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductNotice;
