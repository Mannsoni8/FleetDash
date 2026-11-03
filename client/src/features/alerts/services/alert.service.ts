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

export const resolveAlert = async (alertId: string) => {
  const response = await api.patch(`/alerts/${alertId}/resolve`);
  return response.data;
};