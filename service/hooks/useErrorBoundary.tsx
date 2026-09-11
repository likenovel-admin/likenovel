"use client";
import {
  classifyGlobalError,
  getServiceUnavailableSnapshot,
  GlobalErrorKind,
  subscribeServiceUnavailable,
} from "@/utils/serviceAvailability";
import React, { PropsWithChildren, useSyncExternalStore } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

const errorCopy: Record<
  GlobalErrorKind,
  { title: string; description: string; action: string }
> = {
  maintenance: {
    title: "서비스를 잠시 이용할 수 없습니다",
    description: "현재 서비스 연결이 원활하지 않습니다. 잠시 후 다시 접속해 주세요.",
    action: "다시 시도",
  },
  unauthorized: {
    title: "로그인이 필요합니다",
    description: "로그인 후 다시 이용해 주세요.",
    action: "로그인하기",
  },
  forbidden: {
    title: "접근할 수 없습니다",
    description: "로그인 상태 또는 이용 권한을 확인해 주세요.",
    action: "홈으로",
  },
  "not-found": {
    title: "페이지를 찾을 수 없습니다",
    description: "주소가 정확한지 확인하거나 홈으로 이동해 주세요.",
    action: "홈으로",
  },
  generic: {
    title: "페이지를 불러오지 못했습니다",
    description: "일시적인 오류가 발생했습니다. 다시 시도해 주세요.",
    action: "다시 시도",
  },
};

export const GlobalErrorSurface = ({ kind }: { kind: GlobalErrorKind }) => {
  const copy = errorCopy[kind];
  const handleAction = () => {
    if (kind === "unauthorized") {
      window.location.assign("/login");
      return;
    }
    if (kind === "forbidden" || kind === "not-found") {
      window.location.assign("/");
      return;
    }
    window.location.reload();
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f7f8fa] px-24pxr py-32pxr">
      <section className="w-full max-w-[480px] rounded-[20px] bg-white px-24pxr py-32pxr text-center shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        <p className="mb-20pxr text-18pxr font-extrabold tracking-[-0.01em] text-primary-100">
          LIKE NOVEL
        </p>
        <h1 className="mb-16pxr text-24pxr font-bold leading-[1.4] text-black-100">
          {copy.title}
        </h1>
        <p className="text-15pxr leading-[1.7] text-dark-gray-500">
          {copy.description}
        </p>
        <button
          type="button"
          className="mt-24pxr min-h-[44px] rounded-[10px] bg-primary-100 px-24pxr text-15pxr font-semibold text-white transition-colors hover:bg-primary-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-100"
          onClick={handleAction}
        >
          {copy.action}
        </button>
      </section>
    </main>
  );
};

const ErrorFallback = ({ error }: FallbackProps) => (
  <GlobalErrorSurface kind={classifyGlobalError(error)} />
);

const ErrorBoundaryWrapper = ({ children }: PropsWithChildren) => {
  const serviceUnavailable = useSyncExternalStore(
    subscribeServiceUnavailable,
    getServiceUnavailableSnapshot,
    () => false
  );

  if (serviceUnavailable) {
    return <GlobalErrorSurface kind="maintenance" />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
  );
};

export default ErrorBoundaryWrapper;
