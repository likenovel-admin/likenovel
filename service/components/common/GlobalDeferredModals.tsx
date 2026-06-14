"use client";

import dynamic from "next/dynamic";

const AiChatPanel = dynamic(() => import("@/components/recommendation/AiChatPanel"), {
  ssr: false,
});
const SearchModal = dynamic(() => import("@/components/search/SearchModal"), {
  ssr: false,
});
const CacheUseModal = dynamic(() => import("@/components/modal/CacheUseModal"), {
  ssr: false,
});
const DonateModal = dynamic(() => import("@/components/modal/DonateModal"), {
  ssr: false,
});
const CacheStatusModal = dynamic(() => import("@/components/modal/CacheStatusModal"), {
  ssr: false,
});
const RentalStatusModal = dynamic(() => import("@/components/modal/RentalStatusModal"), {
  ssr: false,
});
const ReportReasonModal = dynamic(() => import("@/components/modal/ReportReasonModal"), {
  ssr: false,
});

const GlobalDeferredModals = () => {
  return (
    <>
      <AiChatPanel />
      <SearchModal />
      <CacheUseModal />
      <DonateModal />
      <CacheStatusModal />
      <RentalStatusModal />
      <ReportReasonModal />
    </>
  );
};

export default GlobalDeferredModals;
