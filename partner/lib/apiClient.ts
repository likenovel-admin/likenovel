import { clearLocalStorage } from "@/lib/utils";
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
  responseType?: "json" | "blob" | "text";
}

// Use local API path that will be rewritten by Next.js
const API_URL = "/api";

class ApiClient {
  private mutex = new Mutex();

  private getStoredToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  private async reissueToken(accessToken: string, refreshToken: string) {
    try {
      const res = await fetch(`${API_URL}/v1/command/auth/token/reissue`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
      });

      if (!res.ok) return null;
      const json = await res.json();
      return (
        json?.data?.auth?.accessToken ||
        json?.data?.token?.accessToken ||
        null
      );
    } catch {
      return null;
    }
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit) {
    const token = this.getStoredToken();
    const authOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    } = props;

    url = `${API_URL}${url}`;

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

    let response = await this.fetchWithAuth(url, options);

    if (
      (response.status === 401 || response.status === 403) &&
      !url.includes("/login")
    ) {
      await this.mutex.waitForUnlock();
      if (!this.mutex.isLocked()) {
        const release = await this.mutex.acquire();
        try {
          const refreshToken = localStorage.getItem("refreshToken");
          const accessToken = this.getStoredToken() || "";
          if (!refreshToken) {
            clearLocalStorage();
          } else {
            const newToken = await this.reissueToken(accessToken, refreshToken);
            if (newToken) {
              localStorage.setItem("token", newToken);
              response = await this.fetchWithAuth(url, options);
            } else {
              clearLocalStorage();
            }
          }
        } finally {
          release();
        }
      } else {
        await this.mutex.waitForUnlock();
        response = await this.fetchWithAuth(url, options);
      }
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
    } else {
      const rawText = await response.text();
      if (!rawText) {
        json = {};
      } else {
        try {
          json = JSON.parse(rawText);
        } catch {
          json = { message: rawText };
        }
      }
    }

    // const json = await response.json();

    // console.log("json", json);
    // console.log("response", response);

    if (url.includes("/login") && response.ok) {
      const { accessToken, refreshToken } = json?.data?.auth;

      console.log("json?.data?.auth", json?.data?.auth);

      if (accessToken) {
        localStorage.setItem("token", accessToken);
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
