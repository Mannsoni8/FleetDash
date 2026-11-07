import { Schema, model } from "mongoose";

import type {
  IVehicleAssignment,
  AssignmentStatus,
} from "../types/vehicle-assignment.types.js";

const vehicleAssignmentSchema = new Schema<IVehicleAssignment>(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    driver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    unassignedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "completed"] satisfies AssignmentStatus[],
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

vehicleAssignmentSchema.index(
  { vehicle: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  }
);

vehicleAssignmentSchema.index(
  { driver: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
  }
);

export const VehicleAssignment = model<IVehicleAssignment>(
  "VehicleAssignment",
  vehicleAssignmentSchema
);