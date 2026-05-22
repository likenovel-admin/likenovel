export const ADMIN_POPUP_QUERY_PATH = "/v1/query/popup";
export const ADMIN_POPUP_QUERY_API_PATH = `/api${ADMIN_POPUP_QUERY_PATH}`;
export const ADMIN_POPUP_HOME_PATHNAME = "/";
export const ADMIN_POPUP_SUPPRESS_RELOAD_WITHOUT_DAILY_HIDE = false;
export const ADMIN_POPUP_PRELOAD_WINDOW_KEY = "__likenovelAdminPopupPreload";
export const ADMIN_POPUP_PRELOAD_SCRIPT_ID = "admin-popup-preload";
export const ADMIN_POPUP_PRELOAD_TIMEOUT_MS = 2500;

export const shouldFetchAdminPopup = (pathname?: string | null) => {
  return pathname === ADMIN_POPUP_HOME_PATHNAME;
};

export const buildAdminPopupPreloadScript = (
  apiPath = ADMIN_POPUP_QUERY_API_PATH
) => {
  const preloadKey = JSON.stringify(ADMIN_POPUP_PRELOAD_WINDOW_KEY);
  const popupPath = JSON.stringify(ADMIN_POPUP_HOME_PATHNAME);
  const popupApiPath = JSON.stringify(apiPath);

  return `(function () {
  if (location.pathname !== ${popupPath}) return;
  var preloadKey = ${preloadKey};
  if (window[preloadKey]) return;
  var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  var timeoutId = controller ? setTimeout(function () {
    controller.abort();
  }, ${ADMIN_POPUP_PRELOAD_TIMEOUT_MS}) : null;
  var preloadState = {
    status: "pending",
    data: null,
    promise: null,
    consumed: false
  };
  window[preloadKey] = preloadState;
  preloadState.promise = fetch(${popupApiPath}, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json"
    },
    signal: controller ? controller.signal : undefined
  })
    .then(function (response) {
      if (!response.ok) throw new Error("Popup request failed: " + response.status);
      return response.json();
    })
    .then(function (payload) {
      preloadState.status = "resolved";
      preloadState.data = payload && payload.data ? payload.data : null;
      return preloadState.data;
    })
    .catch(function () {
      preloadState.status = "rejected";
      preloadState.data = null;
      return null;
    })
    .finally(function () {
      if (timeoutId) clearTimeout(timeoutId);
    });
})();`;
};
