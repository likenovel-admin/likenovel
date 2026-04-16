import { useSelectNotices } from "@/app/api/query/notice";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Pagination from "../common/Pagination";
import RoundBadge from "../common/RoundBadge";
import Spinner from "../common/Spinner";
import Arrow from "/public/images/arrow-right-medium.svg";

const NoticeList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const countPerPage = 10;

  const { data, isLoading } = useSelectNotices(currentPage, countPerPage);

  const sortedData = useMemo(() => {
    // Check different possible response structures
    const notices = data?.data || [];
    if (!Array.isArray(notices)) return [];

    // Sort: primary notices first, then by created date (newest first)
    return [...notices].sort((a: any, b: any) => {
      // Primary notices come first
      if (a.primary_yn !== b.primary_yn) {
        return a.primary_yn === "Y" ? -1 : 1;
      }
      // Within same group, sort by date (newest first)
      return (
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      );
    });
  }, [data]);

  return (
    <>
      <div className="text-18pxr md:text-24pxr font-bold w-full border-b pb-2 md:pb-4">
        공지사항
      </div>
      <ul>
        {isLoading ? (
          <li className="flex justify-center items-center py-10">
            <Spinner size={20} />
          </li>
        ) : (
          <>
            {sortedData.map((notice) => (
              <li key={notice.id}>
                <NoticeItem {...notice} />
              </li>
            ))}
          </>
        )}
      </ul>
      {/* Show pagination if available in response */}
      {data?.totalItems && data?.totalItems > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(data.totalItems / countPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </>
  );
};

interface INoticeItemProps {
  subject: string;
  id: number;
  created_date: string;
  primary_yn: "Y" | "N";
}

const NoticeItem = ({
  subject,
  created_date,
  primary_yn,
  id,
}: INoticeItemProps) => {
  const router = useRouter();
  const isNew = dayjs().diff(dayjs(created_date), "day") < 7;

  return (
    <button
      className="pt-3 pb-5 md:pt-4 w-full md:pb-6 border-b flex justify-between items-center hover:bg-gray-50 transition-colors"
      onClick={() => {
        router.push(`/product/customer-service/notice/${id}`);
      }}
    >
      <div className="flex flex-col items-start">
        <div className="text-15pxr md:text-18pxr font-medium flex gap-2 items-center w-full">
          {primary_yn === "Y" && (
            <RoundBadge
              type="custom"
              color="bg-[#FF5500]"
              text="중요"
              className="w-7 h-4 md:w-8 md:h-5 flex-shrink-0"
            />
          )}
          <span className="truncate min-w-0 flex-1 text-left">{subject}</span>
          {isNew && (
            <div className="text-10pxr md:text-14pxr text-[#2f7fff] font-bold flex-shrink-0">
              N
            </div>
          )}
        </div>
        <div className="text-11pxr md:text-13pxr text-gray-400 mt-2">
          {dayjs(created_date).format("YYYY-MM-DD")}
        </div>
      </div>
      <button className="">
        <Arrow className="w-[7px] h-[11px] text-gray-400" />
      </button>
    </button>
  );
};

export default NoticeList;
