import { clearLocalStorage } from "@/lib/utils";
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
  private getStoredToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  private async getErrorCode(response: Response): Promise<string> {
    try {
      const rawText = await response.clone().text();
      if (!rawText) return "";
      const parsed = JSON.parse(rawText);
      return parsed?.code ?? "";
    } catch {
      return "";
    }
  }

  private async fetchWithAuth(
    endpoint: string,
    options: RequestInit,
    notAuth = false
  ) {
    const token = this.getStoredToken();
    const authOptions = {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(notAuth ? {} : token ? { Authorization: `Bearer ${token}` } : {}),
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
    const errorCode = await this.getErrorCode(response);
    const shouldHandleAuthError = errorCode === "E4010" || errorCode === "E4011";

    if (
      (response.status === 401 || response.status === 403) &&
      !url.includes("/login") &&
      shouldHandleAuthError
    ) {
      if (errorCode === "E4011") {
        clearLocalStorage();
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
    } else if (responseType === "none") {
      json = null;
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
    const message =
      json?.detail ||
      json?.message ||
      json?.error ||
      (typeof json === "string" ? json : "") ||
      "Request failed";
    const error = new Error(message);
    (error as any).statusCode = response.status;
    (error as any).code = json?.code ?? "";
    (error as any).error = json?.error ?? "";

    throw error;
  }
}

// Export instance
const apiClient = new ApiClient();
export default apiClient;
