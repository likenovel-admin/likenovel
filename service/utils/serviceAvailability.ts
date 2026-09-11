export type GlobalErrorKind =
  | "maintenance"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "generic";

type ServiceUnavailableListener = () => void;

const NETWORK_ERROR_CODES = new Set([
  "ECONNABORTED",
  "ERR_NETWORK",
  "ETIMEDOUT",
]);

let serviceUnavailable = false;
const serviceUnavailableListeners = new Set<ServiceUnavailableListener>();

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;

const getStatus = (error: unknown): number | null => {
  const errorRecord = asRecord(error);
  const responseRecord = asRecord(errorRecord?.response);
  const responseStatus = responseRecord?.status;
  if (typeof responseStatus === "number") return responseStatus;

  const directStatus = errorRecord?.status;
  return typeof directStatus === "number" ? directStatus : null;
};

const isLikeNovelApiRequest = (error: unknown): boolean => {
  const errorRecord = asRecord(error);
  const configRecord = asRecord(errorRecord?.config);
  const baseURL = configRecord?.baseURL;
  const url = configRecord?.url;

  return (
    baseURL === "/api" ||
    (typeof url === "string" &&
      (url.startsWith("/api/") || url.startsWith("/v1/")))
  );
};

export const classifyGlobalError = (error: unknown): GlobalErrorKind => {
  const status = getStatus(error);

  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";

  if (
    status !== null &&
    status >= 500 &&
    status <= 599 &&
    isLikeNovelApiRequest(error)
  ) {
    return "maintenance";
  }

  const errorRecord = asRecord(error);
  const code = errorRecord?.code;
  const message = errorRecord?.message;
  const isNetworkFailure =
    (typeof code === "string" && NETWORK_ERROR_CODES.has(code)) ||
    message === "Network Error";

  if (status === null && isNetworkFailure && isLikeNovelApiRequest(error)) {
    return "maintenance";
  }

  return "generic";
};

export const markServiceUnavailable = (): void => {
  if (serviceUnavailable) return;
  serviceUnavailable = true;
  serviceUnavailableListeners.forEach((listener) => listener());
};

export const reportServiceUnavailable = (
  error: unknown,
  required: boolean
): boolean => {
  if (!required || classifyGlobalError(error) !== "maintenance") return false;

  markServiceUnavailable();
  return true;
};

export const resetServiceUnavailable = (): void => {
  if (!serviceUnavailable) return;
  serviceUnavailable = false;
  serviceUnavailableListeners.forEach((listener) => listener());
};

export const subscribeServiceUnavailable = (
  listener: ServiceUnavailableListener
): (() => void) => {
  serviceUnavailableListeners.add(listener);
  return () => serviceUnavailableListeners.delete(listener);
};

export const getServiceUnavailableSnapshot = (): boolean =>
  serviceUnavailable;
