import { BASE_URL } from "@/config";

export const GET_WPS_OPEN_URL = {
  url: `${BASE_URL}/wps/open-url`,
  method: "get",
  headers: { "content-type": "application/json" },
  timeout: 30000,
};
