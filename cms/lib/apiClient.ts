import { clearLocalStorage } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthenticate";
import { Mutex } from "async-mutex";
import queryString from "query-string";

export interface IRequest {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  queryParams?: Record<string, any>;
  useCredentials?: boolean;
  headers?: Record<string, string>;
  nextOption?: RequestInit;
  isFile?: boolean;
  responseType?: "json" | "blob" | "text" | "none";
  isFullUrl?: boolean;
  notAuth?: boolean;
}

const API_URL = '/api';

class ApiClient {
  private mutex = new Mutex();

  private token = localStorage.getItem("token");
  private refreshToken = localStorage.getItem("refreshToken");

  private async getToken(refreshToken: string) {
    const res = await fetch(`${API_URL}/getToken`, {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      referrerPolicy: "unsafe-url",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return res.json();
  }

  private async fetchWithAuth(
    endpoint: string,
    options: RequestInit,
    notAuth = false
  ) {
    const authOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: notAuth ? "" : `Bearer ${this.token}`,
      },
    };

    return fetch(endpoint, authOptions);
  }

  public async request<T>(props: IRequest): Promise<T> {
    let {
      url,
      method,
      body,
      queryParams = {},
      useCredentials = false,
      headers = {},
      nextOption = {},
      isFile = false,
      responseType = "json",
      isFullUrl = false,
      notAuth = false,
    } = props;

    url = isFullUrl ? url : `${API_URL}${url}`;

    if (queryParams && Object.keys(queryParams).length > 0) {
      const trimmedParams = Object.entries(queryParams).reduce(
        (acc, [key, value]) => {
          acc[key] = typeof value === "string" ? value.trim() : value;
          return acc;
        },
        {} as Record<string, any>
      );

      url = `${url}?${queryString.stringify(trimmedParams)}`;
    }

    const baseHeaders: HeadersInit = {
      ...headers,
    };

    if (!isFile) {
      baseHeaders["Content-Type"] = "application/json";
    }

    const options: RequestInit = {
      method,
      headers: baseHeaders,
      body: body ? (isFile ? body : JSON.stringify(body)) : null,
      ...nextOption,
    };

    if (useCredentials) {
      options.credentials = "include";
    }

    let response = await this.fetchWithAuth(url, options, notAuth);

    if (
      (response.status === 401 || response.status === 403) &&
      !url.includes("/login")
    ) {
      // const { setIsAuthenticated } = useAuthStore();
      this.token = null;
      clearLocalStorage();
      // setIsAuthenticated(false);
      // window.location.href = "/login";
      //   useAuthStore.getState().setIsAuthenticated(false);
      //   window.location.href = "/login";
      //   // await this.mutex.waitForUnlock();
      //   // if (!this.mutex.isLocked()) {
      //   //   const release = await this.mutex.acquire();
      //   //   try {
      //   //     const refreshToken = localStorage.getItem("refreshToken");
      //   //     if (!refreshToken) return response as T;
      //   //     const { data } = await this.getToken(refreshToken);
      //   //     if (data) {
      //   //       localStorage.setItem("token", data);
      //   //       response = await this.fetchWithAuth(url, options);
      //   //     } else {
      //   //       sessionStorage.removeItem("userProfile");
      //   //       localStorage.removeItem("token");
      //   //       localStorage.removeItem("refreshToken");
      //   //     }
      //   //   } finally {
      //   //     release();
      //   //   }
      //   // } else {
      //   //   await this.mutex.waitForUnlock();
      //   //   response = await this.fetchWithAuth(url, options);
      //   // }
    }

    let json: any;

    if (responseType === "blob") {
      const blob = await response.blob();
      if (response.ok) {
        return {
          data: blob,
          headers: response.headers,
        } as T;
      } else {
        throw new Error("파일 다운로드에 실패했습니다.");
      }
    } else if (responseType === "text") {
      json = await response.text();
    } else if (responseType === "none") {
      json = null;
    } else {
      json = await response.json();
    }

    // const json = await response.json();

    // console.log("json", json);
    // console.log("response", response);

    if (url.includes("/login") && response.ok) {
      const { accessToken, refreshToken } = json?.data?.auth;

      if (accessToken) {
        localStorage.setItem("token", accessToken);
        this.token = accessToken;
      }

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
    }

    if (response.ok) return json as T;

    // if (method === "GET") {
    //   console.log("lllllllllll");
    //   return {
    //     statusCode: response.status,
    //     message: json?.message ?? "",
    //     error: json?.error ?? "",
    //   } as any;
    // }
    const error = new Error(json?.detail || json?.message || "Request failed");
    (error as any).statusCode = response.status;
    (error as any).code = json?.code ?? "";
    (error as any).error = json?.error ?? "";

    throw error;
  }
}

// Export instance
const apiClient = new ApiClient();
export default apiClient;
