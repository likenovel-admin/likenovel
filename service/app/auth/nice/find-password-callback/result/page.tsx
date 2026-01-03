"use client";

import { useEffect } from "react";

/**
 * Client component to close popup and redirect parent window
 */
export default function FindPasswordCallbackResult() {
  useEffect(() => {
    const processResult = async () => {
      try {
        // Get redirect URL from session via API
        // const response = await fetch("/api/auth/find-password/result");
        // const data = await response.json();

        // console.log("[NICE Find-Password Result] Redirect URL:", data.redirectUrl);

        const url = new URL(window.location.href);
        const redirectUrl =
          url.searchParams.get("redirectUrl") || "/find-id-fail";

        // Close popup and redirect parent
        if (window.opener) {
          console.log(
            "[NICE Find-Password Result] Redirecting parent window..."
          );
          window.opener.location.href = redirectUrl;
          console.log("[NICE Find-Password Result] Closing popup...");
          window.close();
        } else {
          console.log(
            "[NICE Find-Password Result] No opener, redirecting current window..."
          );
          window.location.href = redirectUrl;
        }
      } catch (error) {
        console.error("[NICE Find-Password Result] Error:", error);
        // Fallback redirect
        if (window.opener) {
          window.opener.location.href = "/find-password?error=unknown";
          window.close();
        } else {
          window.location.href = "/find-password?error=unknown";
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
