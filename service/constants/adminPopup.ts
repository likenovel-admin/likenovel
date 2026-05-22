export const ADMIN_POPUP_QUERY_PATH = "/v1/query/popup";
export const ADMIN_POPUP_QUERY_API_PATH = `/api${ADMIN_POPUP_QUERY_PATH}`;
export const ADMIN_POPUP_HOME_PATHNAME = "/";
export const ADMIN_POPUP_SUPPRESS_RELOAD_WITHOUT_DAILY_HIDE = false;

export const shouldFetchAdminPopup = (pathname?: string | null) => {
  return pathname === ADMIN_POPUP_HOME_PATHNAME;
};
