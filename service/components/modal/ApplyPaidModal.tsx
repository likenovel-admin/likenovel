import CheckBox from "@/components/common/CheckBox";
import UserNickname from "@/components/common/UserNickname";
import useModalStore from "@/store/modalStore";
import { IProduct } from "@/types";
import { getLatestEpisodeDate } from "@/utils/getLatestEpisodeDate";
import { getUpdateFrequency } from "@/utils/getUpdateFrequency";
import Image from "next/image";
import { useState } from "react";
import Close from "/public/images/close.svg";

interface Props {
  data: IProduct;
  onConfirm?: () => void;
}

const ApplyPaidModal = ({ data, onConfirm }: Props) => {
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const { closeModal } = useModalStore();
  const handleSubmit = () => {
    if (!agreeToTerms) return;
    if (onConfirm) {
      onConfirm();
      closeModal();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-white md:bg-[#F5F6FA] w-screen h-screen md:w-auto md:h-auto md:mt-[-5px] rounded-none md:rounded-[20px] overflow-hidden">
      {/* Header */}
      <div className="bg-white w-full">
        <div className="w-full flex justify-center relative pt-[19px]">
          <span className="text-14pxr flex justify-center md:text-18pxr font-semibold">
            일반 승급
          </span>
          <div className="flex justify-end pb-10pxr absolute right-[14px] top-[10px]">
            <button onClick={closeModal} className="mt-4 mr-4">
              <Close className="w-[15px] h-[15px]" />
            </button>
          </div>
        </div>

        <div className="w-full h-[1px] border border-t-[#EFF0F4]  border-b-0 border-l-0 border-r-0 mt-[13px]" />
      </div>

      {/* Product Info Section */}
      <div className="bg-white flex items-center gap-4 w-full px-21pxr py-25pxr">
        <div className="relative w-60pxr h-90pxr flex-shrink-0">
          <Image
            src={data.image.coverImagePath}
            alt="Product cover"
            fill
            className="object-cover rounded"
          />
        </div>
        <div className="flex flex-col justify-center md:items-start md:mr-4">
          <div className="text-16pxr font-semibold text-[#111317]">
            {data.title}
          </div>
          <div className="flex gap-13pxr">
            <UserNickname
              userNickname={data.authorNickname || ""}
              product={data}
              hasGle
            />
            {data?.illustratorNickname ? (
              <>
                <span className="text-gray-300">|</span>
                <div className="text-14pxr text-[#4D5159]">
                  {data?.illustratorNickname}
                </div>
              </>
            ) : null}
            {data?.properties?.latestEpisodeDate ? (
              <>
                <span className="text-gray-300">|</span>
                <div className="text-14pxr text-[#4D5159]">
                  {getLatestEpisodeDate(data.properties?.latestEpisodeDate)}
                </div>
              </>
            ) : null}
          </div>
          <div className="flex items-center flex-wrap">
            <span className="text-14pxr text-[#4D5159]">
              총 {data.trendindex?.hasEpisodeCount}{data.publishRegularYn === "N" ? "권" : "화"}
            </span>
            <div className="w-3pxr h-3pxr bg-[#B2B5C3] rounded-full mx-11pxr" />
            <span className="text-14pxr text-[#4D5159]">
              {getUpdateFrequency(data.properties?.updateFrequency || "")}
            </span>
          </div>
        </div>
      </div>

      {/* Rating Section */}
      <div className="mt-10pxr bg-white w-full px-21pxr py-25pxr">
        {/* Guidelines Section */}
        <div className="mb-13pxr px-[14px] py-[15px] bg-[#F5F5F5]">
          <p className="text-13pxr font-semibold mb-5pxr text-[#111317]">
            안내사항
          </p>
          <ul className="text-12pxr">
            <li className="flex items-center">
              <div className="w-3pxr h-3pxr bg-[#B2B5C3] rounded-full ml-1pxr mr-7pxr" />
              <span className="text-12pxr font-normal text-[#4D5159] leading-[18px] tracking-[-2%]">
                계약 없이 진행하는 나홀로 유료화입니다.
              </span>
            </li>
            <li className="flex items-center">
              <div className="w-3pxr h-3pxr bg-[#B2B5C3] rounded-full ml-1pxr mr-7pxr" />
              <span className="text-12pxr font-normal text-[#4D5159] leading-[18px] tracking-[-2%]">
                심사에 따라 유료화 여부가 결정되며, 심사는 최대 2주가
                소요됩니다.
              </span>
            </li>
            <li className="flex items-center">
              <div className="w-3pxr h-3pxr bg-[#B2B5C3] rounded-full ml-1pxr mr-7pxr" />
              <span className="text-12pxr font-normal text-[#4D5159] leading-[18px] tracking-[-2%]">
                심사 반려 후에 딱 1회만 재심사가 가능하니 신중하게 넣어주세요.
              </span>
            </li>
            <li className="flex items-center">
              <div className="w-3pxr h-3pxr bg-[#B2B5C3] rounded-full ml-1pxr mr-7pxr" />
              <span className="text-12pxr font-normal text-[#4D5159] leading-[18px] tracking-[-2%]">
                유료화 이후에도 다른 CP와 계약이 가능하며, 권한이 이행됩니다.
              </span>
            </li>
            <li className="flex items-center">
              <div className="w-3pxr h-3pxr bg-[#B2B5C3] rounded-full ml-1pxr mr-7pxr" />
              <span className="text-12pxr font-normal text-[#4D5159] leading-[18px] tracking-[-2%]">
                유료화 이후에는 작품을 삭제하기 어렵습니다.
              </span>
            </li>
          </ul>
        </div>

        {/* Terms Agreement Checkbox */}
        <div className="flex items-start gap-3">
          <CheckBox
            label="(필수) 안내사항을 모두 확인하였으며 이용에 동의합니다."
            labelStyle="text-13pxr font-normal text-[#424751]"
            checkBoxStyle="w-[20px] h-[20px] border "
            checked={agreeToTerms}
            onChange={(e) => {
              const checked = e.target.checked;
              setAgreeToTerms(checked);
            }}
          />
        </div>
      </div>

      {/* Bottom Divider */}
      <div className="w-full border border-t-[#EFF0F4] border-b-0 border-l-0 border-r-0" />

      {/* Bottom Action Buttons */}
      <div className="hidden md:flex bg-white w-full h-[60px] mt-auto md:mt-0 justify-center items-center">
        <button
          className="w-full font-normal text-[16px] text-[#4D5159] hover:text-dark-gray-100"
          onClick={() => closeModal()}
        >
          돌아가기
        </button>
        <div className="h-full border border-l-[#EFF0F4] border-r-0 border-t-0 border-b-0" />
        <button
          className={`w-full font-medium text-[16px] text-[#176BF2] disabled:text-gray-500`}
          onClick={handleSubmit}
          disabled={!agreeToTerms}
        >
          유료전환 신청
        </button>
      </div>
      <div className="flex md:hidden bg-white w-full gap-[16px] h-[60px] mt-auto md:mt-0 justify-center items-center pb-21pxr px-21pxr">
        <button
          className="basis-[27.7%] rounded-[10px] w-full px-[7px] h-[45px] text-16pxr text-black-200 hover:opacity-50 border border-light-gray-600"
          onClick={() => closeModal()}
        >
          돌아가기
        </button>
        <button
          className="bg-black-100 rounded-[10px] px-[7px] w-full h-[45px] text-16pxr font-semibold text-white hover:opacity-90 disabled:opacity-50"
          onClick={handleSubmit}
          disabled={!agreeToTerms}
        >
          유료전환 신청
        </button>
      </div>
    </div>
  );
};

export default ApplyPaidModal;
