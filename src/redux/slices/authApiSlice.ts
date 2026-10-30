import { baseApi, type ApiEnvelope } from "../store/baseApi";
import { userFromResponse, type AuthUser } from "@/lib/authSession";

export interface LoginBody {
  email: string;
  password: string;
}

/** What login and supplier sign-up answer with. */
export interface SessionResponse {
  message?: string;
  user: AuthUser;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiEnvelope<SessionResponse>, LoginBody>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["Auth"],
    }),

    registerSupplier: builder.mutation<ApiEnvelope<SessionResponse>, Record<string, unknown>>({
      query: (body) => ({
        url: "/auth/register-supplier",
        method: "POST",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["Auth"],
    }),

    getMe: builder.query<AuthUser | null, void>({
      query: () => "/auth/me",
      providesTags: ["Auth"],
      transformResponse: (res: unknown) => userFromResponse(res),
    }),

    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
        credentials: "include",
      }),
      invalidatesTags: ["Auth"],
    }),

    updateProfile: builder.mutation({
      query: (body) => ({
        url: "/auth/profile",
        method: "PATCH",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["Auth"],
    }),

    changePassword: builder.mutation({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
        credentials: "include",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterSupplierMutation,
  useGetMeQuery,
  useLogoutMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;

