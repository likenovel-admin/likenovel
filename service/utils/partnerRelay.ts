import { instance } from "@/app/api/axios";

interface IRelayIssueResponse {
  data?: {
    data?: {
      relay?: {
        relayKey?: string;
      };
    };
  };
}

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

interface IMoveToPartnerRelayOptions {
  refreshToken?: string | null;
}

export const moveToPartnerSettlementWithRelay = async (
  options?: IMoveToPartnerRelayOptions
) => {
  const partnerBase = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_PARTNER_SITE_URL || "http://localhost:3001"
  );

  const refreshToken =
    options?.refreshToken ||
    localStorage.getItem("refresh_token") ||
    sessionStorage.getItem("refresh_token") ||
    localStorage.getItem("refreshToken") ||
    sessionStorage.getItem("refreshToken");

  if (!refreshToken) {
    window.location.href = `${partnerBase}/login`;
    return;
  }

  try {
    const res = await instance.post("/v1/command/auth/token/partner-relay/issue", {
      refresh_token: refreshToken,
    });
    const relayKey = (res as IRelayIssueResponse)?.data?.data?.relay?.relayKey;
    if (!relayKey) {
      throw new Error("Missing relay key");
    }

    window.location.href = `${partnerBase}/auth/relay?relay_key=${encodeURIComponent(relayKey)}`;
  } catch (error) {
    window.location.href = `${partnerBase}/login`;
  }
};
