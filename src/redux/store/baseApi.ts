import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/lib/apiBase";
import { refreshSession } from "@/lib/authSession";
import { logout } from "../slices/authSlice";

const normalizePath = (url: string): string => {
  const cleaned = url.replace(/^\/?(api\/v\d+\/)+/, "").replace(/^\/+/, "");
  return `/${cleaned}`;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    headers.set("x-portal", "supplier");
    return headers;
  },
});

const isAuthEndpoint = (url: string) =>
  /\/auth\/(login|logout|refresh|register|register-supplier)\b/.test(url);

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let normalizedArgs: string | FetchArgs = args;
  if (typeof args === "string") {
    normalizedArgs = normalizePath(args);
  } else if (args && typeof args === "object" && args.url) {
    normalizedArgs = { ...args, url: normalizePath(args.url) };
  }

  let result = await rawBaseQuery(normalizedArgs, api, extraOptions);

  if (result.error?.status === 401) {
    const urlStr =
      typeof normalizedArgs === "string" ? normalizedArgs : normalizedArgs.url;
    if (isAuthEndpoint(urlStr)) return result;

    const refreshed = await refreshSession();
    if (refreshed.ok) {
      result = await rawBaseQuery(normalizedArgs, api, extraOptions);
      if (result.error?.status === 401) {
        api.dispatch(logout());
      }
    } else if (refreshed.definitive) {
      api.dispatch(logout());
    }
  }

  return result;
};

/** Every successful API response is `{ success: true, data }`. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 300,
  tagTypes: ["Auth", "Supplier", "SupplierCatalog", "PurchaseOrder"],
  endpoints: () => ({}),
});

