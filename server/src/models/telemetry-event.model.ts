import { Schema, model, Types } from "mongoose";
import type { ITelemetryReading } from "../types/telemetry.types.js";

export type TelemetryEventStatus = "pending" | "completed";

export interface ITelemetryEvent {
    _id: Types.ObjectId;
    vehicleId: Types.ObjectId;
    eventId: string;
    reading: ITelemetryReading;
    status: TelemetryEventStatus;
    createdAt: Date;
    updatedAt: Date;
}

const telemetryEventSchema = new Schema<ITelemetryEvent>(
    {
        vehicleId: {
            type: Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true,
        },
        eventId: {
            type: String,
            required: true,
            trim: true,
            maxlength: 128,
        },
        reading: {
            type: Schema.Types.Mixed,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "completed"],
            default: "pending",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

telemetryEventSchema.index(
    { vehicleId: 1, eventId: 1 },
    { unique: true, name: "unique_vehicle_telemetry_event" }
);

export const TelemetryEvent = model<ITelemetryEvent>(
    "TelemetryEvent",
    telemetryEventSchema
);