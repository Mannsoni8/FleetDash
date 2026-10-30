import { Schema, model } from "mongoose";
import type {
  IAlert,
  AlertType,
  AlertSeverity,
  GeofenceTransition,
} from "../types/alert.types.js";

const alertSchema = new Schema<IAlert>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
      index: true,
    },

    geofenceId: {
      type: Schema.Types.ObjectId,
      ref: "Geofence",
      index: true,
    },

    sourceEventId: {
      type: String,
      trim: true,
      maxlength: 128,
    },

    transition: {
      type: String,
      enum: ["entry", "exit"] satisfies GeofenceTransition[],
    },

    type: {
      type: String,
      enum: [
        "geofence_breach",
        "overspeed",
        "vehicle_offline",
        "telemetry_anomaly",
      ] satisfies AlertType[],
      required: true,
      index: true,
    },

    severity: {
      type: String,
      enum: [
        "low",
        "medium",
        "high",
        "critical",
      ] satisfies AlertSeverity[],
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },

    occurredAt: {
      type: Date,
      required: true,
      index: true,
    },

    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One geofence transition alert per vehicle, event and geofence.
alertSchema.index(
  {
    vehicleId: 1,
    sourceEventId: 1,
    geofenceId: 1,
    transition: 1,
  },
  {
    unique: true,
    name: "unique_geofence_transition_alert",
    partialFilterExpression: {
      sourceEventId: { $type: "string" },
      geofenceId: { $exists: true },
      transition: { $exists: true },
    },
  }
);

alertSchema.index({
  vehicleId: 1,
  occurredAt: -1,
});

alertSchema.index({
  resolved: 1,
  occurredAt: -1,
});

export const Alert = model<IAlert>("Alert", alertSchema);
