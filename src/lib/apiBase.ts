// Central place that configures the API location.
// Tolerates both https://api.alaynai.com and https://api.alaynai.com/api/v1 in .env

const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const API_VERSION = "v1";
export const API_BASE_DOMAIN = RAW_URL.replace(/\/+$/, "").replace(/\/api\/v\d+$/, "");
export const API_BASE_URL = `${API_BASE_DOMAIN}/api/${API_VERSION}`;

export const MAIN_APP_URL = (
  process.env.NEXT_PUBLIC_MAIN_APP_URL || "http://localhost:3000"
).replace(/\/+$/, "");
