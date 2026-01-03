"use client";
import InquiryForm from "@/components/customer-service/InquiryForm";

const Page = () => {
  return (
    <>
      <div className="text-18pxr md:text-24pxr font-bold w-full border-b pb-4">
        1:1문의
        <div className="text-11pxr md:text-14pxr text-gray-600 font-normal whitespace-pre mt-2">{`문의량 증가시 답변이 다소 지연될 수 있습니다.
순차적으로 답변드릴 예정이오니 조금만 기다려주시길 부탁드립니다.`}</div>
      </div>
      <InquiryForm />
    </>
  );
};

export default Page;
