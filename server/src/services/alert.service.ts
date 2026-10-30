import { Types } from "mongoose";
import { Alert } from "../models/alert.model.js";
import type {
  GeofenceTransition,
} from "../types/alert.types.js";

export interface GetAlertsFilters {
  severity?: "low" | "medium" | "high" | "critical";
  type?: "geofence_breach" | "overspeed" | "vehicle_offline" | "telemetry_anomaly";
  resolved?: boolean;
  vehicleId?: string;
  page?: number;
  limit?: number;
}

const validatePagination = (page: number, limit: number): void => {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error("Page must be a positive integer");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Limit must be between 1 and 100");
  }
};

export const getAlerts = async (filters: GetAlertsFilters) => {
  const {
    severity,
    type,
    resolved,
    vehicleId,
    page = 1,
    limit = 20,
  } = filters;

  const query: Record<string, unknown> = {};

  if (severity) query.severity = severity;
  if (type) query.type = type;
  if (resolved !== undefined) query.resolved = resolved;

  if (vehicleId) {
    if (!Types.ObjectId.isValid(vehicleId)) {
      throw new Error("Invalid vehicle ID");
    }

    query.vehicleId = new Types.ObjectId(vehicleId);
  }

  validatePagination(page, limit);
  const skip = (page - 1) * limit;

  const [alerts, total] = await Promise.all([
    Alert.find(query)
      .sort({ occurredAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Alert.countDocuments(query),
  ]);

  return {
    alerts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAlertById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid alert ID");
  }

  const alert = await Alert.findById(id).lean();

  if (!alert) {
    throw new Error("Alert not found");
  }

  return alert;
};

export const getAlertsByVehicle = async (
  vehicleId: string,
  page = 1,
  limit = 20,
) => {
  if (!Types.ObjectId.isValid(vehicleId)) {
    throw new Error("Invalid vehicle ID");
  }

  const query = { vehicleId: new Types.ObjectId(vehicleId) };
  const skip = (page - 1) * limit;

  const [alerts, total] = await Promise.all([
    Alert.find(query)
      .sort({ occurredAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Alert.countDocuments(query),
  ]);

  return {
    alerts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const resolveAlert = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid alert ID");
  }

  const alert = await Alert.findOneAndUpdate(
    { _id: id, resolved: false },
    {
      $set: {
        resolved: true,
        resolvedAt: new Date(),
      },
    },
    { new: true, runValidators: true },
  ).lean();

  if (!alert) {
    throw new Error("Alert not found or already resolved");
  }

  return alert;
};

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
