import { Types } from "mongoose";
import { Vehicle } from "../models/vehicle.model.js";
import { TelemetryBucket } from "../models/telemetry.model.js";
import type { ITelemetryReading } from "../types/telemetry.types.js";
import type { TelemetryRequestBody } from "../types/telemetry-request.types.js";
import { TelemetryWorkerPool } from "../workers/worker-pool.js";

let telemetryWorkerPool: TelemetryWorkerPool | undefined;

const getTelemetryWorkerPool = (): TelemetryWorkerPool => {
    if (!telemetryWorkerPool) {
        telemetryWorkerPool = new TelemetryWorkerPool();
    }

    return telemetryWorkerPool;
};

export const closeTelemetryWorkerPool = async (): Promise<void> => {
    if (telemetryWorkerPool) {
        const pool = telemetryWorkerPool;
        telemetryWorkerPool = undefined;
        await pool.close();
    }
};

export const getBucketStart = (timestamp: Date): Date => {
    const bucketStart = new Date(timestamp);

    bucketStart.setMinutes(0);
    bucketStart.setSeconds(0);
    bucketStart.setMilliseconds(0);

    return bucketStart;
};


export const addTelemetryReading = async (
    vehicleId: Types.ObjectId,
    reading: ITelemetryReading
): Promise<void> => {
    const bucketStart = getBucketStart(reading.timestamp);

    await TelemetryBucket.findOneAndUpdate(
        {
            vehicleId,
            bucketStart,
        },
        {
            $push: {
                readings: reading,
            },

            $inc: {
                readingCount: 1,
            },
        },
        {
            upsert: true,
            returnDocument: "after",
        }
    );
};

export const getTelemetryByTimeRange = async (
    vehicleId: Types.ObjectId,
    start: Date,
    end: Date
) => {
    const buckets = await TelemetryBucket.find({
        vehicleId,
        bucketStart: {
            $gte: getBucketStart(start),
            $lte: getBucketStart(end),
        },
    })
        .sort({ bucketStart: 1 })
        .lean();

    return buckets;
};

export const processTelemetry = async (
    data: TelemetryRequestBody
): Promise<{
    vehicleId: string;
    timestamp: Date;
}> => {
    const {
        vehicleId,
        latitude,
        longitude,
        speed,
        batteryLevel,
        fuelLevel,
    } = data;

    const reading = await getTelemetryWorkerPool().process(data);
    const telemetryTimestamp = reading.timestamp;

    const vehicle = await Vehicle.findOne({ vehicleId });

    if (!vehicle) {
        throw new Error("VEHICLE_NOT_FOUND");
    }

    await addTelemetryReading(
        vehicle._id as Types.ObjectId,
        reading
    );

    vehicle.currentLocation = {
        latitude,
        longitude,
    };

    vehicle.currentSpeed = speed;
    vehicle.lastTelemetryAt = telemetryTimestamp;
    vehicle.status = "online";

    if (batteryLevel !== undefined) {
        vehicle.batteryLevel = batteryLevel;
    }

    if (fuelLevel !== undefined) {
        vehicle.fuelLevel = fuelLevel;
    }

    await vehicle.save();

    return {
        vehicleId: vehicle.vehicleId,
        timestamp: telemetryTimestamp,
    };
};