import { Types } from "mongoose";
import { Vehicle } from "../models/vehicle.model.js";
import { TelemetryBucket } from "../models/telemetry.model.js";
import { TelemetryEvent } from "../models/telemetry-event.model.js";
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
    bucketStart.setUTCMinutes(0);
    bucketStart.setUTCSeconds(0);
    bucketStart.setUTCMilliseconds(0);
    return bucketStart;
};

const isDuplicateKeyError = (error: unknown): boolean =>
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000;

export const addTelemetryReading = async (
    vehicleId: Types.ObjectId,
    reading: ITelemetryReading
): Promise<void> => {
    const bucketStart = getBucketStart(reading.timestamp);

    // Ensure the hourly bucket exists. Concurrent upserts can race
    // while the unique bucket index is being enforced.
    try {
        await TelemetryBucket.updateOne(
            { vehicleId, bucketStart },
            {
                $setOnInsert: {
                    vehicleId,
                    bucketStart,
                    readings: [],
                    readingCount: 0,
                },
            },
            { upsert: true }
        );
    } catch (error) {
        if (!isDuplicateKeyError(error)) {
            throw error;
        }
    }

    // Insert and increment the count atomically, only if this event
    // is not already present in the bucket.
    await TelemetryBucket.updateOne(
        {
            vehicleId,
            bucketStart,
            "readings.eventId": { $ne: reading.eventId },
        },
        {
            $push: { readings: reading },
            $inc: { readingCount: 1 },
        }
    );

    // A zero-match update is expected for an existing event.
    // Verify that the event is actually present before proceeding.
    const storedReading = await TelemetryBucket.exists({
        vehicleId,
        bucketStart,
        "readings.eventId": reading.eventId,
    });

    if (!storedReading) {
        throw new Error("TELEMETRY_READING_NOT_PERSISTED");
    }
};

export const getTelemetryByTimeRange = async (
    vehicleId: Types.ObjectId,
    start: Date,
    end: Date
) => {
    return TelemetryBucket.find({
        vehicleId,
        bucketStart: {
            $gte: getBucketStart(start),
            $lte: getBucketStart(end),
        },
    })
        .sort({ bucketStart: 1 })
        .lean();
};


export const getPreviousTelemetryReading = async (
    vehicleId: Types.ObjectId,
    timestamp: Date,
): Promise<ITelemetryReading | null> => {
    const previousReadings =
        await TelemetryBucket.aggregate<ITelemetryReading>([
            {
                $match: {
                    vehicleId,
                    bucketStart: {
                        $lte: getBucketStart(timestamp),
                    },
                },
            },
            {
                $unwind: "$readings",
            },
            {
                $match: {
                    "readings.timestamp": {
                        $lt: timestamp,
                    },
                },
            },
            {
                $sort: {
                    "readings.timestamp": -1,
                },
            },
            {
                $limit: 1,
            },
            {
                $replaceRoot: {
                    newRoot: "$readings",
                },
            },
        ]);

    return previousReadings[0] ?? null;
};

export const processTelemetry = async (
    data: TelemetryRequestBody
): Promise<{ vehicleId: string; timestamp: Date }> => {
    const vehicle = await Vehicle.findOne({ vehicleId: data.vehicleId });

    if (!vehicle) {
        throw new Error("VEHICLE_NOT_FOUND");
    }

    const vehicleObjectId = vehicle._id as Types.ObjectId;

    // The first accepted payload becomes canonical. Retries reuse it,
    // including its original timestamp.
    let proposedReading = await getTelemetryWorkerPool().process(data);

    let event = await TelemetryEvent.findOne({
        vehicleId: vehicleObjectId,
        eventId: data.eventId.trim(),
    });

    if (!event) {
        try {
            await TelemetryEvent.create({
                vehicleId: vehicleObjectId,
                eventId: data.eventId.trim(),
                reading: proposedReading,
                status: "pending",
            });
        } catch (error) {
            if (!isDuplicateKeyError(error)) {
                throw error;
            }
        }

        event = await TelemetryEvent.findOne({
            vehicleId: vehicleObjectId,
            eventId: data.eventId.trim(),
        });
    }

    if (!event) {
        throw new Error("TELEMETRY_EVENT_CLAIM_FAILED");
    }

    if (!event) {
        throw new Error("TELEMETRY_EVENT_CLAIM_FAILED");
    }

    const reading = event.reading as ITelemetryReading;
    proposedReading = reading;

    if (event.status === "completed") {
        return {
            vehicleId: vehicle.vehicleId,
            timestamp: reading.timestamp,
        };
    }

    // Both operations below are safe to retry after a partial failure.
    await addTelemetryReading(vehicleObjectId, reading);

    const vehicleUpdate: Record<string, unknown> = {
        currentLocation: {
            latitude: reading.latitude,
            longitude: reading.longitude,
        },
        currentSpeed: reading.speed,
        lastTelemetryAt: reading.timestamp,
        status: "online",
    };

    if (reading.batteryLevel !== undefined) {
        vehicleUpdate.batteryLevel = reading.batteryLevel;
    }

    if (reading.fuelLevel !== undefined) {
        vehicleUpdate.fuelLevel = reading.fuelLevel;
    }

    // Older or equal timestamps cannot overwrite the current state.
    await Vehicle.updateOne(
        {
            _id: vehicleObjectId,
            $or: [
                { lastTelemetryAt: null },
                { lastTelemetryAt: { $lt: reading.timestamp } },
            ],
        },
        { $set: vehicleUpdate }
    );

    // Mark complete only after both persistence operations succeed.
    await TelemetryEvent.updateOne(
        { _id: event._id, status: "pending" },
        { $set: { status: "completed" } }
    );

    return {
        vehicleId: vehicle.vehicleId,
        timestamp: reading.timestamp,
    };
};
