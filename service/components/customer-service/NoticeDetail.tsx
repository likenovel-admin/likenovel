import { instance } from "@/app/api/axios";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Button from "../common/Button";
import Spinner from "../common/Spinner";

const NoticeDetail = ({ noticeId }: { noticeId: string }) => {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["noticeDetail", noticeId],
    async queryFn() {
      const response = await instance.get(`/v1/query/notices/${noticeId}`);
      return response.data.data;
      //       return {
      //         subject: `기다리면 무료 대여 이용권 충전 완료 시
      // 앱 노출 변경에 대한 안내`,
      //         content: `안녕하세요. 운영팀입니다.

      // 기다리면 무료 대여권이 충전되면 '기다무 1장 지금사용가능'으로 표기되고 보유한 대여권 수량이 포함되지 않도록 분리될 예정입니다.

      // AS IS
      // - 기다리면 무료 대여권 충전완료 되면, 대여권 수량에 포함됨
      // - 기다무 '충전완료' 표기

      // TO BE
      // - 기다리면 무료 대여권 충전완료 되면, 대여권 수량에 포함안됨
      // - '기다무 대여권 1장 지금 사용가능' 표기

      // [적용앱 버전]
      // - 7.13.0버전 업데이트부터 적용

      // 더 나은 서비스 제공을 위해 계속해서 노력하겠습니다.
      // 감사합니다.

      // @ 운영팀 드림`,
      //         createdDate: "2021-10-01",
      //       };
    },
  });
  const { content, created_date, subject } = useMemo(() => {
    return data! ?? {};
  }, [data]);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Spinner size={20} />
        </div>
      ) : (
        <>
          <div className="px-4 border-b-8 pb-10 md:pb-12 border-b-gray-100">
            <div className="border-b flex flex-col items-center w-full pb-[25px] md:pb-12 gap-4">
              <div className="whitespace-pre-wrap text-center text-21pxr md:text-32pxr font-semibold">
                {subject}
              </div>
              <div className="text-11pxr md:text-13pxr text-gray-500">
                {dayjs(created_date).format("YYYY-MM-DD")}
              </div>
            </div>
            <div
              className="mt-6 md:mt-10 md:p-4 font-medium text-gray-500 leading-6 break-words [&_p]:m-0 [&_p:not(:last-child)]:mb-1 [&_p:empty]:min-h-[1.5em] [&_ul]:pl-6 [&_ul]:list-disc [&_ol]:pl-6 [&_ol]:list-decimal [&_blockquote]:pl-3.5 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_strong]:font-bold [&_em]:italic [&_u]:underline"
              dangerouslySetInnerHTML={{
                __html: content || "",
              }}
            />
          </div>
          <div className="p-5 md:pt-10 text-center flex justify-center">
            <Button
              variant="secondary"
              className="block md:hidden w-full"
              onClick={() => router.push("/product/customer-service/notice")}
            >
              목록
            </Button>
            <Button
              variant="secondary"
              size="xl"
              className="w-[176px] md:block hidden"
              onClick={() => router.push("/product/customer-service/notice")}
            >
              목록
            </Button>
          </div>
        </>
      )}
    </>
  );
};

export default NoticeDetail;
