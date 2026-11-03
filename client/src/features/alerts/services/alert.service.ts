import api from "../../../lib/axios";
import type { AlertListResponse, AlertSeverity } from "../types/alert";

export interface AlertFilters {
  resolved?: boolean;
  severity?: AlertSeverity;
  vehicleId?: string;
}

export const getAlerts = async (
  page = 1,
  limit = 20,
  filters: AlertFilters = {}
): Promise<AlertListResponse> => {
  const response = await api.get<AlertListResponse>("/alerts", {
    params: {
      page,
      limit,
      ...(filters.resolved !== undefined && {
        resolved: filters.resolved,
      }),
      ...(filters.severity && {
        severity: filters.severity,
      }),
      ...(filters.vehicleId && {
        vehicleId: filters.vehicleId,
      }),
    },
  });

  return response.data;
};

export const resolveAlert = async (alertId: string) => {
  const response = await api.patch(`/alerts/${alertId}/resolve`);
  return response.data;
};
