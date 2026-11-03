import { useEffect, useState } from "react";
import { getVehicles } from "../../vehicles/services/vehicle.service";
import { socket } from "../../../lib/socket";
import type { TrackingVehicle } from "../types/tracking";
import type { TelemetryUpdate } from "../../../types/realtime";

export const useVehicleTracking = () => {
  const [vehicles, setVehicles] = useState<TrackingVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await getVehicles();
        setVehicles(response.vehicles);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch tracking vehicles:", err);
        setError("Unable to load vehicles.");
      } finally {
        setLoading(false);
      }
    };

    const handleTelemetry = (data: TelemetryUpdate) => {
      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.vehicleId === data.vehicleId
            ? {
                ...vehicle,
                currentLocation: {
                  latitude: data.latitude,
                  longitude: data.longitude,
                },
                currentSpeed: data.speed,
                lastTelemetryAt: data.timestamp,
              }
            : vehicle
        )
      );
    };

    socket.on("telemetry:update", handleTelemetry);
    socket.connect();

    fetchVehicles();

    return () => {
      socket.off("telemetry:update", handleTelemetry);
    };
  }, []);

  return { vehicles, loading, error };
};