import api from "../../../lib/axios";
import type { AlertListResponse } from "../types/alert";

export const getAlerts = async (
  page = 1,
  limit = 20
): Promise<AlertListResponse> => {
  const response = await api.get<AlertListResponse>("/alerts", {
    params: { page, limit },
  });

  return response.data;
};
