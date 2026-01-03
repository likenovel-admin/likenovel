import useModalStore from "@/store/modalStore";
import { useState } from "react";
import RadioButton from "../common/RadioButtom";
import TriangleWarnRed from "/public/images/triangle-warn-red.svg";
interface Props {
  reportType: "product" | "comment" | "chat";
  confirmText?: string | JSX.Element;
  reportOptions: { value: string; label: string }[];
  onConfirm?: (selectedValue: string, reportContent: string) => void;
}

const ReportModal = ({ reportType, reportOptions, onConfirm }: Props) => {
  const [selectedValue, setSelectedValue] = useState<string>(
    reportOptions[0].value
  );
  const [reportContent, setReportContent] = useState<string>("");
  const { closeModal } = useModalStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(e.target.value);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReportContent(e.target.value);
  };

  return (
    <div className="flex h-full flex-col  items-center justify-center mt-[-5px]">
      <span className="text-14pxr md:text-18pxr font-semibold">
        {reportType === "product" ? "작품" : reportType === "chat" ? "채팅" : "댓글"} 신고
      </span>
      <div className="w-full border border-t-light-gray-500 border-b-0 border-l-0 border-r-0 mt-10pxr mb-10pxr md:mb-24pxr" />
      <div className="flex flex-col justify-start w-full pl-25pxr">
        <div className="flex flex-col w-[80%] gap-[9px]">
          {reportOptions?.map((option) => (
            <RadioButton
              key={option.value}
              label={option.label}
              value={option.value}
              name="reportOption"
              checked={selectedValue === option.value}
              onChange={handleChange}
            />
          ))}
        </div>
        <textarea
          className="w-[90%] text-14pxr border border-light-gray-300 rounded-[8px] resize-none p-3 mt-19pxr placeholder-dark-gray-200"
          placeholder="신고 내용을 적어주세요."
          onChange={handleTextareaChange}
        />
        <div className="flex gap-5pxr mt-9pxr">
          <TriangleWarnRed className="mb-[-5px] w-[18px] md:w-[23px] h-[18px] md:h-[23px]" />
          <span className="text-12pxr md:text-14pxr text-dark-gray-400">
            허위 신고시 이용이 제한 됩니다.
          </span>
        </div>
      </div>
      <div className="w-full border border-t-light-gray-500 border-b-0 border-l-0 border-r-0 mt-30pxr" />
      <div className="w-full h-[60px] flex justify-center items-center">
        <button
          className="w-full hover:text-dark-gray-100"
          onClick={() => closeModal()}
        >
          취소
        </button>
        <div className="h-full border border-l-light-gray-500 border-r-0 border-t-0 border-b-0" />
        <button
          className="w-full hover:text-red-100"
          onClick={() => {
            if (onConfirm) onConfirm(selectedValue, reportContent);
            closeModal();
          }}
          disabled={!selectedValue}
        >
          신고
        </button>
      </div>
    </div>
  );
};

export default ReportModal;
