import assert from "node:assert/strict";

import {
  classifyGlobalError,
  getServiceUnavailableSnapshot,
  markServiceUnavailable,
  reportServiceUnavailable,
  resetServiceUnavailable,
  subscribeServiceUnavailable,
} from "./serviceAvailability.ts";

const apiError = (status: number) => ({
  response: { status },
  config: { baseURL: "/api", url: "/v1/query/user" },
});

assert.equal(classifyGlobalError(apiError(500)), "maintenance");
assert.equal(classifyGlobalError(apiError(502)), "maintenance");
assert.equal(classifyGlobalError(apiError(503)), "maintenance");
assert.equal(classifyGlobalError(apiError(504)), "maintenance");
assert.equal(classifyGlobalError(apiError(403)), "forbidden");
assert.equal(classifyGlobalError(apiError(404)), "not-found");
assert.equal(classifyGlobalError(apiError(401)), "unauthorized");

assert.equal(
  classifyGlobalError({
    code: "ERR_NETWORK",
    message: "Network Error",
    config: { baseURL: "/api", url: "/v1/command/auth/signin" },
  }),
  "maintenance",
  "LikeNovel API connection failures must show the independent maintenance surface"
);
assert.equal(
  classifyGlobalError({ code: "ERR_NETWORK", message: "Network Error" }),
  "generic",
  "unrelated client errors must not be mislabeled as a service outage"
);

resetServiceUnavailable();
assert.equal(reportServiceUnavailable(apiError(500), false), false);
assert.equal(
  getServiceUnavailableSnapshot(),
  false,
  "optional API failures must stay local to their caller"
);
assert.equal(reportServiceUnavailable(apiError(500), true), true);
assert.equal(
  getServiceUnavailableSnapshot(),
  true,
  "required API failures must activate the maintenance surface"
);
resetServiceUnavailable();
assert.equal(reportServiceUnavailable(apiError(403), true), false);
assert.equal(getServiceUnavailableSnapshot(), false);

resetServiceUnavailable();
let notifications = 0;
const unsubscribe = subscribeServiceUnavailable(() => {
  notifications += 1;
});

markServiceUnavailable();
assert.equal(getServiceUnavailableSnapshot(), true);
assert.equal(notifications, 1);

markServiceUnavailable();
assert.equal(notifications, 1, "the outage transition should be idempotent");

resetServiceUnavailable();
assert.equal(getServiceUnavailableSnapshot(), false);
assert.equal(notifications, 2);
unsubscribe();
