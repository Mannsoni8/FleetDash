import { useCallback, useEffect, useState } from "react";
import { getAlerts } from "../services/alert.service";
import type { AlertFilters } from "../services/alert.service";
import type { Alert, AlertSeverity } from "../types/alert";

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFiltersState] = useState<AlertFilters>({});

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAlerts(page, 20, filters);

      setAlerts(response.alerts);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      setError("Unable to load alerts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const updateFilters = (newFilters: {
    resolved?: boolean | null;
    severity?: AlertSeverity | null;
    vehicleId?: string;
  }) => {
    setPage(1);

    setFiltersState((current) => {
      const updated = { ...current };

      if ("resolved" in newFilters) {
        if (newFilters.resolved === null) {
          delete updated.resolved;
        } else {
          updated.resolved = newFilters.resolved;
        }
      }

      if ("severity" in newFilters) {
        if (newFilters.severity === null) {
          delete updated.severity;
        } else {
          updated.severity = newFilters.severity;
        }
      }

      if ("vehicleId" in newFilters) {
        const vehicleId = newFilters.vehicleId?.trim();

        if (vehicleId) {
          updated.vehicleId = vehicleId;
        } else {
          delete updated.vehicleId;
        }
      }

      return updated;
    });
  };

  const nextPage = () => {
    setPage((current) => Math.min(current + 1, totalPages));
  };

  const previousPage = () => {
    setPage((current) => Math.max(current - 1, 1));
  };

  return {
    alerts,
    page,
    totalPages,
    total,
    loading,
    error,
    filters,
    updateFilters,
    nextPage,
    previousPage,
    refetch: fetchAlerts,
  };
};
