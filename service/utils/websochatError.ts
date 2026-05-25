export const WEBSOCHAT_CONNECTION_ERROR_NOTICE =
  "지금은 접속이 원활하지 않아요. 잠시 후 다시 시도해 주세요.";

type WebsochatErrorLike = {
  name?: string;
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
      code?: string;
    };
  };
};

const TECHNICAL_STREAM_ERROR_PATTERNS = [
  /^fetch failed$/i,
  /^failed to fetch$/i,
  /^network error$/i,
  /^load failed$/i,
  /^websochat stream failed$/i,
  /^bad request$/i,
  /^unauthorized$/i,
  /^forbidden$/i,
  /^not found$/i,
  /^too many requests$/i,
  /^request timeout$/i,
  /^bad gateway$/i,
  /^internal server error$/i,
  /^service unavailable$/i,
  /^gateway timeout$/i,
  /networkerror/i,
  /stream completed event missing/i,
  /stream done event arrived without assistant_completed/i,
];

const extractWebsochatErrorMessage = (error: unknown) => {
  const errorLike = error as WebsochatErrorLike | null;
  const responseMessage = errorLike?.response?.data?.message;
  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage.trim();
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }
  if (typeof errorLike?.message === "string" && errorLike.message.trim()) {
    return errorLike.message.trim();
  }
  return "";
};

export const isWebsochatAbortError = (error: unknown) => {
  const errorLike = error as WebsochatErrorLike | null;
  return errorLike?.name === "AbortError";
};

export const isWebsochatTechnicalStreamErrorMessage = (message: string) => {
  const normalized = message.trim();
  if (!normalized) return false;
  return TECHNICAL_STREAM_ERROR_PATTERNS.some((pattern) => pattern.test(normalized));
};

export const getWebsochatSafeUserMessage = (
  error: unknown,
  fallbackMessage = WEBSOCHAT_CONNECTION_ERROR_NOTICE,
) => {
  const message = extractWebsochatErrorMessage(error);
  if (message && !isWebsochatTechnicalStreamErrorMessage(message)) {
    return message;
  }
  return fallbackMessage;
};

export const isRetryableWebsochatStreamError = (error: unknown) => {
  if (isWebsochatAbortError(error)) return false;

  const errorLike = error as WebsochatErrorLike | null;
  const status = errorLike?.response?.status;
  if (typeof status === "number") {
    return status >= 500 && status <= 599;
  }

  const message = extractWebsochatErrorMessage(error);
  return isWebsochatTechnicalStreamErrorMessage(message);
};
