import assert from "node:assert/strict";
import {
  WEBSOCHAT_CONNECTION_ERROR_NOTICE,
  getWebsochatSafeUserMessage,
  isRetryableWebsochatStreamError,
} from "./websochatError.ts";

const withResponse = (
  status: number,
  data?: { message?: string; code?: string },
) => {
  const error = new Error(data?.message || "request failed") as Error & {
    response?: { status: number; data?: { message?: string; code?: string } };
  };
  error.response = { status, data };
  return error;
};

assert.equal(
  isRetryableWebsochatStreamError(new TypeError("fetch failed")),
  true,
);

assert.equal(
  isRetryableWebsochatStreamError(withResponse(502, { message: "Bad Gateway" })),
  true,
);

assert.equal(
  isRetryableWebsochatStreamError(withResponse(400, { message: "캐시 잔액이 부족합니다." })),
  false,
);

assert.equal(
  isRetryableWebsochatStreamError(new Error("AI 서비스 호출에 실패했습니다.")),
  false,
);

assert.equal(
  getWebsochatSafeUserMessage(new TypeError("fetch failed")),
  WEBSOCHAT_CONNECTION_ERROR_NOTICE,
);

assert.equal(
  getWebsochatSafeUserMessage(new Error("websochat stream completed event missing")),
  WEBSOCHAT_CONNECTION_ERROR_NOTICE,
);

assert.equal(
  getWebsochatSafeUserMessage(withResponse(400, { message: "캐시 잔액이 부족합니다." })),
  "캐시 잔액이 부족합니다.",
);
