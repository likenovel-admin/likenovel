"use client";
import Button from "@/components/common/Button";
import EvaluationModal from "@/components/modal/EvaluationModal";
import EvaluationResultModal from "@/components/modal/EvaluationResultModal";
import PromotionModal from "@/components/modal/PromotionModal";
import SelectSampleImageModal from "@/components/modal/SelectSampleImageModal";
import SendAlarmModal from "@/components/modal/SendAlarmModal";
import { useState } from "react";

const Page = () => {
  return (
    <div className="p-10 flex flex-col gap-4 w-full max-w-[400px]">
      <AlarmTemplate />
      <EvaluationTemplate />
      <EvaluationResultTemplate />
      <SampleImageTemplate />
      <ReportReasonEpisodeTemplate />
      <ReportReasonChatTemplate />
      <RentalStatusTemplate />
      <CacheStatusTemplate />
      <CacheUseTemplate />
      <DonateTemplate />
      <SuggestionTemplate />
      <PromotionTemplate />
    </div>
  );
};

const AlarmTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>알림 보내기</Button>
      <SendAlarmModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};
const EvaluationTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>평가하기</Button>
      <EvaluationModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};
const EvaluationResultTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>평가결과 확인</Button>
      <EvaluationResultModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

const SampleImageTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>샘플이미지 선택</Button>
      <SelectSampleImageModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

const ReportReasonEpisodeTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>신고사유(작품)</Button>
      {/* <ReportReasonModal
        isOpen={open}
        onClose={() => setOpen(false)}
        type="episode"
      /> */}
    </>
  );
};

const ReportReasonChatTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>신고사유(채팅)</Button>
      {/* <ReportReasonModal
        isOpen={open}
        onClose={() => setOpen(false)}
        type="chat"
      /> */}
    </>
  );
};

const RentalStatusTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>대여권 현황</Button>
      {/* <RentalStatusModal
        title="소설 속 엑스트라 3회"
        isOpen={open}
        onClose={() => setOpen(false)}
      /> */}
    </>
  );
};
const CacheStatusTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>캐시충전 현황</Button>
      {/* <CacheStatusModal
        title="소설 속 엑스트라 3회"
        isOpen={open}
        onClose={() => setOpen(false)}
      /> */}
    </>
  );
};

const CacheUseTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>캐시사용</Button>
      {/* <CacheUseModal isOpen={open} onClose={() => setOpen(false)} /> */}
    </>
  );
};

const DonateTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>후원하기</Button>
      {/* <DonateModal isOpen={open} onClose={() => setOpen(false)} /> */}
    </>
  );
};
const SuggestionTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>제안하기</Button>
      {/* <SuggestionModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="동성애 치료캠프"
      /> */}
    </>
  );
};
const PromotionTemplate = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>직접 프로모션</Button>
      <PromotionModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default Page;
