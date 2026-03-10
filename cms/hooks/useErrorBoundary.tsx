"use client";
import React, { PropsWithChildren, useState } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white text-red-700 border border-red-300 rounded shadow p-6">
        <div className="flex justify-between items-start">
          <strong className="text-red-800 text-lg">에러 발생</strong>
          <button
            onClick={resetErrorBoundary}
            className="text-sm text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm whitespace-pre-wrap">{errorMessage}</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={resetErrorBoundary}
            className="text-sm px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>
  );
};

const ErrorBoundaryWrapper = ({ children }: PropsWithChildren) => {
  const [resetKey, setResetKey] = useState(0);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => setResetKey((prev) => prev + 1)} // ✅ Reset key
    >
      <div key={resetKey}>{children}</div>
    </ErrorBoundary>
  );
};

export default ErrorBoundaryWrapper;
