"use client";
import { useSelectProductDetail } from "@/app/api/query/product";
import CheckBox from "@/components/common/CheckBox";
import UserNickname from "@/components/common/UserNickname";
import useModalStore from "@/store/modalStore";
import { IProduct } from "@/types";
import { getLatestEpisodeDate } from "@/utils/getLatestEpisodeDate";
import { getUpdateFrequency } from "@/utils/getUpdateFrequency";
import Image from "next/image";
import { useMemo, useState } from "react";
import CircleBlue from "/public/images/circle-blue.svg";
import CloseRed from "/public/images/close-red.svg";
import Close from "/public/images/close.svg";

interface Props {
  data: IProduct;
  onConfirm?: () => void;
}

const CONDITION_COUNT_CHARACTER = 20000;
const CONDITION_COUNT_EPISODE = 5;

const GeneralPromotionModal = ({ data, onConfirm }: Props) => {
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  const { closeModal } = useModalStore();

  const { data: productDetailData, isLoading } = useSelectProductDetail(
    data.productId
  );

  const totalEpisodeTextCount = useMemo(() => {
    if (!productDetailData?.data?.episodes) return 0;
    return productDetailData.data.episodes.reduce(
      (total, episode) => total + episode.episodeTextCount,
      0
    );
  }, [productDetailData]);

  const conditions = useMemo(() => {
    return [
      {
        value: "episode",
        label: "화차수",
        isPass:
          (data?.trendindex?.hasEpisodeCount || 0) >= CONDITION_COUNT_EPISODE,
      },
      {
        value: "character",
        label: "굴자수",
        isPass: totalEpisodeTextCount >= CONDITION_COUNT_CHARACTER,
      },
      { value: "free", label: "자유연재", isPass: true },
    ];
  }, [data, totalEpisodeTextCount]);

  const canSubmit = useMemo(() => {
    return conditions.every((condition) => condition.isPass) && agreeToTerms;
  }, [conditions, agreeToTerms]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (onConfirm) {
      closeModal();
      onConfirm();
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center mt-[-5px] bg-[#F5F6FA]">
      {/* Header */}
      <div className="bg-white w-full">
        <div className="w-full flex justify-center relative pt-[19px]">
          <span className="text-14pxr flex justify-center md:text-18pxr font-semibold">
            일반 승급
          </span>
          <div className="flex justify-end pb-10pxr absolute right-[14px] top-[10px]">
            <button onClick={closeModal} className="mt-4 mr-4">
              {Close ? (
                <Close className="w-[15px] h-[15px]" />
              ) : (
                <div className="w-[15px] h-[15px] text-gray-500">✕</div>
              )}
            </button>
          </div>
        </div>

        <div className="w-full h-[1px] border border-t-[#EFF0F4]  border-b-0 border-l-0 border-r-0 mt-[13px]" />
      </div>

      {/* Product Info Section */}
      <div className="bg-white flex items-center gap-4 w-full px-21pxr py-25pxr">
        <div className="relative w-60pxr h-90pxr flex-shrink-0">
          <Image
            src={
              data.image.coverImagePath ||
              "https://cdn.likenovel.net/cover/ESokN0lzSgG0um4rn4tBeg.webp"
            }
            alt="Product cover"
            fill
            className="object-cover rounded"
          />
        </div>
        <div className="flex flex-col items-center md:items-start md:mr-4">
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
              총{" "}
              {productDetailData?.data?.episodes?.length ||
                data.trendindex?.hasEpisodeCount}
              화
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
        <p className="text-14pxr font-medium mb-10pxr">조건 만족여부</p>

        <div className="flex w-full justify-center gap-10pxr mb-20pxr">
          {conditions.map((option) => (
            <div
              key={option.value}
              className="flex flex-1 h-94pxr border rounded-[14px] flex-col items-center justify-between cursor-pointer pt-[22px] pb-[10px] px-[10px]"
            >
              <button
                className={`rounded-[14px] flex items-center justify-center transition-all`}
              >
                {option.isPass ? (
                  CircleBlue ? (
                    <CircleBlue className="w-28pxr h-28pxr" />
                  ) : (
                    <div className="w-28pxr h-28pxr bg-blue-500 rounded-full" />
                  )
                ) : CloseRed ? (
                  <CloseRed className="w-23pxr h-23pxr" />
                ) : (
                  <div className="w-23pxr h-23pxr bg-red-500" />
                )}
              </button>
              <span
                className={`w-full bg-[#F5F5F5] rounded-[100px] text-13pxr font-normal text-[#6B6E76] text-center`}
              >
                {option.label}
              </span>
            </div>
          ))}
        </div>

        {/* Guidelines Section */}
        <div className="mb-13pxr px-[14px] py-[15px] bg-[#F5F5F5]">
          <p className="text-13pxr font-semibold mb-5pxr text-[#111317]">
            안내사항
          </p>
          <ul className="text-12pxr">
            <li className="flex items-center">
              <div className="w-3pxr h-3pxr bg-[#B2B5C3] rounded-full ml-1pxr mr-7pxr" />
              <span className="text-12pxr font-normal text-[#4D5159] leading-[18px] tracking-[-2%]">
                {CONDITION_COUNT_EPISODE}회차 이상, 글자 수{" "}
                {CONDITION_COUNT_CHARACTER.toLocaleString()}자 이상 충족될 경우
                신청 할 수 있습니다.
              </span>
            </li>
            <li className="flex items-center">
              <div className="w-3pxr h-3pxr bg-[#B2B5C3] rounded-full ml-1pxr mr-7pxr" />
              <span className="text-12pxr font-normal text-[#4D5159] leading-[18px] tracking-[-2%]">
                작품은 무료-일반으로 승급되며, 유료 전환 신청이 가능합니다.
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
      <div className="bg-white w-full h-[60px] flex justify-center items-center">
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
          disabled={!canSubmit}
        >
          일반 승급신청
        </button>
      </div>
    </div>
  );
};

export default GeneralPromotionModal;
