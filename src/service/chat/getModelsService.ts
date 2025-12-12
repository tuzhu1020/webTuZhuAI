import request from "@/service";
import { BASE_URL } from "@/config";

export interface AIModelResponse {
  id: string;
  name: string;
  provider: string;
  model: string;
  description?: string;
  maxTokens?: number;
  category?: string;
  responseTime?: string;
  ownedBy?: string;
}

export default async function getModelsService(): Promise<AIModelResponse[]> {
  const response = await request({
    url: `${BASE_URL}/ai/models`,
    method: "get",
    headers: { "content-type": "application/json" },
    timeout: 10000,
  });

  return response.data || [];
}
