import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { checkSession, type AuthUser } from "@/lib/authSession";

export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  isAuthenticated: boolean;
  verifying: boolean;
  verifyFailed: boolean;
  lastVerifiedAt: number | null;
}

const initialState: AuthState = {
  status: "unknown",
  user: null,
  isAuthenticated: false,
  verifying: false,
  verifyFailed: false,
  lastVerifiedAt: null,
};

export const SESSION_FRESH_MS = 60_000;

export const verifySession = createAsyncThunk<void, void, { state: { auth: AuthState } }>(
  "auth/verifySession",
  async (_arg, { dispatch }) => {
    const result = await checkSession();
    if (result.kind === "ok") {
      dispatch(sessionVerified(result.user));
    } else if (result.kind === "unauthenticated") {
      dispatch(logout());
    } else {
      dispatch(sessionCheckFailed());
    }
  },
  {
    condition: (_arg, { getState }) => !getState().auth.verifying,
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser }>
    ) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.status = "authenticated";
      state.lastVerifiedAt = Date.now();
    },
    sessionVerified: (state, action: PayloadAction<AuthUser>) => {
      state.status = "authenticated";
      state.user = action.payload;
      state.isAuthenticated = true;
      state.verifyFailed = false;
      state.lastVerifiedAt = Date.now();
    },
    sessionCheckFailed: (state) => {
      state.verifyFailed = true;
    },
    logout: (state) => {
      state.status = "unauthenticated";
      state.user = null;
      state.isAuthenticated = false;
      state.lastVerifiedAt = null;
      state.verifyFailed = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifySession.pending, (state) => {
        state.verifying = true;
      })
      .addCase(verifySession.fulfilled, (state) => {
        state.verifying = false;
      })
      .addCase(verifySession.rejected, (state) => {
        state.verifying = false;
      });
  },
});

export const { setCredentials, sessionVerified, sessionCheckFailed, logout } =
  authSlice.actions;

export default authSlice.reducer;

