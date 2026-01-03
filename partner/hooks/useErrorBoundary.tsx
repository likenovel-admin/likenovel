"use client";
import React, { PropsWithChildren } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div>
      <p> 에러: {error.message} </p>
      <button onClick={() => resetErrorBoundary()}> 다시 시도 </button>
    </div>
  );
};

const ErrorBoundaryWrapper = ({ children }: PropsWithChildren) => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>
  );
};

export default ErrorBoundaryWrapper;
