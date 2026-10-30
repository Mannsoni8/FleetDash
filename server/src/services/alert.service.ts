import { Types } from "mongoose";
import { Alert } from "../models/alert.model.js";
import type {
  GeofenceTransition,
} from "../types/alert.types.js";

interface CreateGeofenceTransitionAlertInput {
  vehicleId: Types.ObjectId;
  geofenceId: Types.ObjectId;
  sourceEventId: string;
  transition: GeofenceTransition;
  geofenceName: string;
  latitude: number;
  longitude: number;
  occurredAt: Date;
}

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

export const createGeofenceTransitionAlert = async (
  data: CreateGeofenceTransitionAlertInput,
): Promise<void> => {
  const message =
    data.transition === "entry"
      ? `Vehicle entered geofence: ${data.geofenceName}`
      : `Vehicle exited geofence: ${data.geofenceName}`;

  try {
    await Alert.updateOne(
      {
        vehicleId: data.vehicleId,
        sourceEventId: data.sourceEventId,
        geofenceId: data.geofenceId,
        transition: data.transition,
      },
      {
        $setOnInsert: {
          vehicleId: data.vehicleId,
          geofenceId: data.geofenceId,
          sourceEventId: data.sourceEventId,
          transition: data.transition,
          type: "geofence_breach",
          severity: "medium",
          message,
          location: {
            latitude: data.latitude,
            longitude: data.longitude,
          },
          occurredAt: data.occurredAt,
          resolved: false,
          resolvedAt: null,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    // A concurrent retry may win the unique-index race.
    if (isDuplicateKeyError(error)) {
      return;
    }

    throw error;
  }
};
