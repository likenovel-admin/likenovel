"use client";

import { useEffect } from "react";

/**
 * Client component to close popup and redirect parent window
 */
export default function FindIdCallbackResult() {
  useEffect(() => {
    const processResult = async () => {
      try {
        // Get result from session via API
        // const response = await fetch("/api/auth/find-id/result", {
        //   cache: "no-store",
        // });
        // const data = await response.json();

        // console.log("[NICE Find-ID Result] Starting...");
        // console.log("[NICE Find-ID Result] Full API Response:", data);
        // console.log("[NICE Find-ID Result] Redirect URL:", data.redirectUrl);
        // console.log("[NICE Find-ID Result] Has logData:", !!data.logData);
        // console.log(
        //   "[NICE Find-ID Result] Has serverLogs:",
        //   !!data.logData?.serverLogs
        // );
        // console.log(
        //   "[NICE Find-ID Result] ServerLogs count:",
        //   data.logData?.serverLogs?.length || 0
        // );
        // console.log(
        //   "[NICE Find-ID Result] Decrypted Data:",
        //   data.logData?.decryptedData
        // );
        // console.log("[NICE Find-ID Result] Log Data:", data.logData);

        // // Store in window for debugging
        // (window as any).niceResultData = data;

        const url = new URL(window.location.href);
        const redirectUrl =
          url.searchParams.get("redirectUrl") || "/find-id-fail";

        // Close popup and redirect parent
        if (window.opener) {
          console.log(
            "[NICE Find-ID Result] Found window.opener, redirecting parent..."
          );
          window.opener.location.href = redirectUrl;
          console.log("[NICE Find-ID Result] Closing popup...");
          window.close();
        } else {
          console.log(
            "[NICE Find-ID Result] No window.opener, redirecting current window..."
          );
          window.location.href = redirectUrl;
        }
      } catch (error) {
        console.error("[NICE Find-ID Result] Error:", error);
        // Fallback redirect
        if (window.opener) {
          window.opener.location.href = "/find-id-fail";
          window.close();
        } else {
          window.location.href = "/find-id-fail";
        }
      }
    };

    processResult();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">본인인증 결과를 처리하는 중...</p>
      </div>
    </div>
  );
}
