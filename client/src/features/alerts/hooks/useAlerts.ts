import { useCallback, useEffect, useState } from "react";
import { getAlerts } from "../services/alert.service";
import type { Alert } from "../types/alert";

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAlerts(page, 20);

      setAlerts(response.alerts);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      setError("Unable to load alerts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

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
    nextPage,
    previousPage,
    refetch: fetchAlerts,
  };
};
