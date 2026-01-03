"use client";
import useModalStore from "@/store/modalStore";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import ModalBottomButton from "../common/ModalBottomButton";
import ModalContainer from "../common/ModalContainer";
import RadioButton from "../common/RadioButtom";
import TextArea from "../form/textarea";

interface ReportReasonModalProps extends CommonModalProps {
  type: "episode" | "chat";
}

const ReportReasonModal = () => {
  const { typeModal, closeTypeModal, typeModalData } = useModalStore();
  const isOpen = typeModal === "REPORT_REASON";
  const onClose = () => {
    closeTypeModal();
  };
  const type = typeModalData?.type || "episode";
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const { register, watch, handleSubmit, control, reset } = useForm();
  const onSubmit = (data: any) => {
    typeModalData?.onSubmit(selectedReason, data.reportDetail);
    setSelectedReason(null);
    reset();
    onClose();
  };
  return (
    <ModalContainer
      title="신고사유"
      isOpen={isOpen}
      onClose={onClose}
      size="full"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col items-center md:w-[560px]">
          <div className="flex flex-col overflow-y-auto md:grid-cols-6 gap-2 items-center px-4 w-full h-max">
            {type === "episode" ? (
              <>
                <ReportReasonItem
                  id={1}
                  isSelected={selectedReason === "offensive_discriminatory"}
                  onClick={() => setSelectedReason("offensive_discriminatory")}
                  label="불쾌한 표현 및 차별/혐오성 표현"
                  descriptions={[
                    "욕설 및 혐오적 표현으로 타인에게 모욕감을 주는 내용",
                    "성별/계층/사상/의견/사회조직 등을 혐오하거나 비하하는 표현",
                    "실존 인물을 포함해 창작물 캐릭터의 외모/취향/장애요소 등을 지나치게 가학적으로, 반복적으로 표현하고 있는 경우",
                  ]}
                />
                <ReportReasonItem
                  id={2}
                  isSelected={selectedReason === "religious_political"}
                  onClick={() => setSelectedReason("religious_political")}
                  label="종교 및 정치 관련 내용"
                  descriptions={[
                    "실존하는 특정 종교나 정치적인 이슈를 맹목적, 편향적으로 다루고 있는 경우",
                    "실존하는 특정 종교를 전도하거나 정치적 성향을 전파하는 경우",
                  ]}
                />

                <ReportReasonItem
                  id={3}
                  isSelected={selectedReason === "illegal_content"}
                  onClick={() => setSelectedReason("illegal_content")}
                  label="범죄/불법정보 포함"
                  descriptions={[
                    "범죄 행위, 불법 링크 공유 등 위법성 정보 제공",
                    "불법 재화나 서비스를 판매하거나 권장하는 경우",
                  ]}
                />

                <ReportReasonItem
                  id={4}
                  isSelected={selectedReason === "sexual_content"}
                  onClick={() => setSelectedReason("sexual_content")}
                  label="반사회적인 성적 표현"
                  descriptions={[
                    "아동이나 청소년을 성 대상화한 표현",
                    "성매매/성착취/불법 촬영 등 불법 성범죄를 중점적으로, 구체적으로 묘사 하고 있는 경우",
                  ]}
                />

                <ReportReasonItem
                  id={5}
                  isSelected={selectedReason === "spam_advertisement"}
                  onClick={() => setSelectedReason("spam_advertisement")}
                  label="스팸홍보/도배"
                  descriptions={[
                    "영리적 목적으로 규정 위반된 업체의 광고성 게시글",
                    "동일하거나 유사한 표현을 비정상적인 주기로 업로드",
                  ]}
                />
              </>
            ) : (
              <>
                <ReportReasonItem
                  id={1}
                  isSelected={selectedReason === "threat_extortion"}
                  onClick={() => setSelectedReason("threat_extortion")}
                  label="협박/갈취/비합리적 금전적 대가 요구"
                  descriptions={[
                    "금전 갈취, 비상식적인 금전적 대가를 요구하거나, 이를 목적으로 협박하는 행위",
                  ]}
                />

                <ReportReasonItem
                  id={2}
                  isSelected={selectedReason === "fraud_impersonation"}
                  onClick={() => setSelectedReason("fraud_impersonation")}
                  label="사기/허위 업체/특정 인물 및 업체 사칭"
                  descriptions={[
                    "업로드된 원고분량 이외의 비축분을 계약행위보다 먼저 요구하는 경우",
                    "위법 소지가 있는 계약, 불공정 계약 등 문체부 표준계약에서 크게 벗어난 계약 사항을 요구할 경우",
                  ]}
                />

                <ReportReasonItem
                  id={3}
                  isSelected={selectedReason === "spam_off_platform"}
                  onClick={() => setSelectedReason("spam_off_platform")}
                  label="반복적 메시지 발송/플랫폼 밖에서만 협의요구"
                  descriptions={[
                    "명확한 채팅 거부의사 또는 계약 거부 의사를 밝혔음에도 지속적으로, 반복적으로 계약에 관련된 메세지를 보내는 행위",
                    "처음부터 신원을 밝히지 않거나, 계약조건을 밝히지 않고 라이크노벨 밖에서 사적 연락을 통해 협의를 요구하는 경우",
                  ]}
                />

                <ReportReasonItem
                  id={4}
                  isSelected={selectedReason === "privacy_copyright"}
                  onClick={() => setSelectedReason("privacy_copyright")}
                  label="개인 신상정보 침해 및 저작권 침해"
                  descriptions={[
                    "계약을 빌미로 특정 유저의 신상정보를 알아내려는 행위",
                    "계약을 빌미로 원고의 저작권을 침해하는 행위",
                  ]}
                />

                <ReportReasonItem
                  id={5}
                  isSelected={selectedReason === "illegal_content"}
                  onClick={() => setSelectedReason("illegal_content")}
                  label="범죄/불법정보 포함"
                  descriptions={[
                    "범죄 행위, 불법 링크 공유 등 위법성 정보 제공",
                    "불법 재화나 서비스를 판매하거나 권장하는 경우",
                  ]}
                />

                <ReportReasonItem
                  id={6}
                  isSelected={selectedReason === "spam_advertisement"}
                  onClick={() => setSelectedReason("spam_advertisement")}
                  label="스팸홍보/도배"
                  descriptions={[
                    "영리적 목적으로 규정 위반된 업체의 광고성 게시글",
                    "동일하거나 유사한 표현을 비정상적인 주기로 업로드",
                  ]}
                />
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 px-4 mt-2">
          <div className="text-16pxr font-semibold">신고 상세 내용</div>
          <Controller
            name="reportDetail"
            control={control}
            render={({ field }) => (
              <TextArea
                inputStyle={"text-14pxr w-full h-[200px]"}
                full
                maxLength={5000}
                {...field}
                additionalText={
                  <span className="text-13pxr text-gray-400">
                    <span className="text-black-100">
                      {field.value?.length ?? 0}
                    </span>
                    / 5000
                  </span>
                }
                placeholder="최대한 상기 항목에 해당하는 문구나 표현을 담아 구체적으로 작성해주세요."
              />
            )}
          />
        </div>
        <div className="w-full mt-auto md:mt-4 sticky bottom-0 bg-white">
          <ModalBottomButton
            rightButton={{ text: "확인", type: "submit" }}
            leftButton={{ text: "취소", onClick: onClose }}
          />
        </div>
      </form>
    </ModalContainer>
  );
};

const ReportReasonItem = ({
  id,
  isSelected,
  onClick,
  label,
  descriptions,
}: {
  id: number;
  isSelected: boolean;
  onClick: () => void;
  label: string;
  descriptions: string[];
}) => {
  return (
    <label
      onClick={onClick}
      key={id}
      className={`w-full border-b flex flex-col py-6 items-center justify-center font-semibold`}
    >
      <RadioButton
        value={`${id}`}
        checked={isSelected}
        label={label}
        name="reportReason"
        onChange={() => {}}
      />
      <ul className="flex flex-col gap-1 list-disc pl-6 mt-2.5 w-full">
        {descriptions.map((description) => (
          <li
            key={description}
            className="text-13pxr font-normal text-dark-gray-400"
          >
            {description}
          </li>
        ))}
      </ul>
    </label>
  );
};

export default ReportReasonModal;
