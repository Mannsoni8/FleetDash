import { parentPort } from "node:worker_threads";
import type { TelemetryRequestBody } from "../types/telemetry-request.types.js";
import type { ITelemetryReading } from "../types/telemetry.types.js";
import type { WorkerResponse } from "../types/telemetry-worker.types.js";

if (!parentPort) {
    throw new Error("Telemetry worker must run inside a worker thread");
}

const port = parentPort;

port.on("message", (data: TelemetryRequestBody) => {
    try {
        const timestamp = data.timestamp
            ? new Date(data.timestamp)
            : new Date();
        if (Number.isNaN(timestamp.getTime())) {
            throw new Error("Invalid telemetry timestamp");
        }

        const result: ITelemetryReading = {
            eventId: data.eventId,
            timestamp,
            latitude: data.latitude,
            longitude: data.longitude,
            speed: data.speed,
            ...(data.heading !== undefined && {
                heading: data.heading,
            }),
            ...(data.batteryLevel !== undefined && {
                batteryLevel: data.batteryLevel,
            }),
            ...(data.fuelLevel !== undefined && {
                fuelLevel: data.fuelLevel,
            }),
        };

        const response: WorkerResponse = {
            success: true,
            result,
        };

        port.postMessage(response);
    } catch (error) {
        const response: WorkerResponse = {
            success: false,
            error: error instanceof Error
                ? error.message
                : "Unknown telemetry processing error",
        };

        port.postMessage(response);
    }
});
