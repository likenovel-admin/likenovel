import { useSelectRollingNotice } from "@/app/api/query/notice";
import { getFormattingDate } from "@/utils/getFormattingDate";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Arrow from "/public/images/arrow-right-medium.svg";

const LastPageNotice = () => {
  const router = useRouter();
  const { data: rollingNotice, isLoading } = useSelectRollingNotice();

  if (isLoading || !rollingNotice?.data) {
    return null;
  }

  const notice = rollingNotice.data;

  return (
    <>
      {notice.length > 0 ? (
        <div
          className="w-full cursor-pointer flex items-center justify-start md:justify-center min-h-[60px] md:min-h-[60px] border-t border-light-gray-300"
          onClick={() => {
            router.push(`/product/customer-service/notice/${notice?.[0]?.id}`);
          }}
        >
          <div className="w-full flex-1 flex items-center justify-start md:justify-around lg:justify-center px-8pxr sm:px-16pxr lg:max-w-[1080px]">
            <Image
              src={"/images/notice.svg"}
              width={20}
              height={22}
              alt="공지사항"
              className="flex-shrink-0"
            />

            <span className="ml-[6px] sm:ml-[10px] md:ml-[16px] mr-[10px] md:mr-[27px] text-12pxr sm:text-13pxr md:text-18pxr font-semibold tracking-[-2%] text-[#191A1F] flex-shrink-0">
              공지사항
            </span>
            <Arrow className="w-[6px] h-[10px] mr-[8px] sm:mr-20pxr flex-shrink-0" />
            <span className="md:flex-1 ml-[4px] sm:ml-[8px] md:ml-[27px] text-12pxr sm:text-13pxr md:text-16pxr font-normal tracking-[-2%] text-[#4D5159] truncate min-w-0">
              {notice?.[0]?.subject}
            </span>
            <span className="ml-[50px] lg:ml-auto text-11pxr md:text-14pxr text-[#6B6E76] tracking-[-2%] flex-shrink-0 hidden sm:block">
              {getFormattingDate(notice?.[0]?.created_date, "YYYY.MM.DD")}
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default LastPageNotice;
