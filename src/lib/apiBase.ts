export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1"
).replace(/\/+$/, "");

export const MAIN_APP_URL = (
  process.env.NEXT_PUBLIC_MAIN_APP_URL || "http://localhost:3000"
).replace(/\/+$/, "");

