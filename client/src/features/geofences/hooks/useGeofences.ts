import { useCallback, useEffect, useState } from "react";

import {
  getGeofences,
  deleteGeofence as deleteGeofenceApi,
} from "../services/geofence.service";

import type { Geofence } from "../types/geofence";

export const useGeofences = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGeofences = useCallback(async () => {
    try {
      setLoading(true);

      const response = await getGeofences();

      setGeofences(response.geofences);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch geofences:", err);
      setError("Unable to load geofences.");
    } finally {
      setLoading(false);
    }
  }, []);

  const removeGeofence = async (geofenceId: string) => {
    try {
      await deleteGeofenceApi(geofenceId);

      setGeofences((current) =>
        current.filter((geofence) => geofence._id !== geofenceId)
      );

      return true;
    } catch (err) {
      console.error("Failed to delete geofence:", err);
      setError("Unable to delete geofence.");
      return false;
    }
  };

  useEffect(() => {
    void fetchGeofences();
  }, [fetchGeofences]);

  return {
    geofences,
    loading,
    error,
    refetch: fetchGeofences,
    removeGeofence,
  };
};