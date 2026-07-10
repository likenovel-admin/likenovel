"use client";
import React, { PropsWithChildren } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { usePathname } from "next/navigation";

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div>
      <p> 에러: {error.message} </p>
      <button onClick={() => resetErrorBoundary()}> 다시 시도 </button>
    </div>
  );
};

export const RouteAwareErrorBoundary = ({
  children,
  pathname,
}: PropsWithChildren<{ pathname: string }>) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} resetKeys={[pathname]}>
      {children}
    </ErrorBoundary>
  );
};

const ErrorBoundaryWrapper = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();

  return (
    <RouteAwareErrorBoundary pathname={pathname}>
      {children}
    </RouteAwareErrorBoundary>
  );
};

export default ErrorBoundaryWrapper;
