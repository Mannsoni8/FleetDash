import { useCallback, useEffect, useState } from "react";
import { getVehicles } from "../services/vehicle.service";
import type { Vehicle } from "../types/vehicle";

export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getVehicles();

      setVehicles(response.vehicles);
    } catch (err) {
      console.error("Failed to fetch vehicles:", err);
      setError("Unable to load vehicles. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    refetch: fetchVehicles,
  };
};
