import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

const mocks = vi.hoisted(() => ({
    vehicleFindOne: vi.fn(),
    vehicleUpdateOne: vi.fn(),
    bucketFindOneAndUpdate: vi.fn(),
    bucketUpdateOne: vi.fn(),
    bucketExists: vi.fn(),
    bucketFind: vi.fn(),
    bucketAggregate: vi.fn(),
    eventFindOne: vi.fn(),
    eventCreate: vi.fn(),
    eventUpdateOne: vi.fn(),
    workerProcess: vi.fn(),
    workerClose: vi.fn(),
    evaluateGeofenceTransitions: vi.fn(),
}));
vi.mock("../../src/services/geofence.service.js", () => ({
    evaluateGeofenceTransitions: mocks.evaluateGeofenceTransitions,
}));

vi.mock("../../src/models/vehicle.model.js", () => ({
    Vehicle: {
        findOne: mocks.vehicleFindOne,
        updateOne: mocks.vehicleUpdateOne,
    },
}));

vi.mock("../../src/models/telemetry.model.js", () => ({
    TelemetryBucket: {
        findOneAndUpdate: mocks.bucketFindOneAndUpdate,
        updateOne: mocks.bucketUpdateOne,
        exists: mocks.bucketExists,
        find: mocks.bucketFind,
        aggregate: mocks.bucketAggregate,
    },
}));

vi.mock("../../src/models/telemetry-event.model.js", () => ({
    TelemetryEvent: {
        findOne: mocks.eventFindOne,
        create: mocks.eventCreate,
        updateOne: mocks.eventUpdateOne,
    },
}));

vi.mock("../../src/workers/worker-pool.js", () => ({
    TelemetryWorkerPool: class {
        process = mocks.workerProcess;
        close = mocks.workerClose;
    },
}));

import {
    addTelemetryReading,
    closeTelemetryWorkerPool,
    getBucketStart,
    getPreviousTelemetryReading,
    getTelemetryByTimeRange,
    processTelemetry,
} from "../../src/services/telemetry.service.js";

describe("Telemetry service", () => {
    const timestamp = new Date("2026-10-27T12:34:56.000Z");
    const vehicleObjectId = new Types.ObjectId();

    const reading = {
        eventId: "evt-test-001",
        timestamp,
        latitude: 22.3072,
        longitude: 73.1812,
        speed: 60,
        heading: 180,
        batteryLevel: 85,
        fuelLevel: 70,
    };

    let vehicle: {
        _id: Types.ObjectId;
        vehicleId: string;
        currentLocation: unknown;
        currentSpeed: number;
        lastTelemetryAt: Date | undefined;
        status: string;
        batteryLevel: number | undefined;
        fuelLevel: number | undefined;
        save: ReturnType<typeof vi.fn>;
    };


    beforeEach(() => {
        vi.resetAllMocks();
        mocks.bucketAggregate.mockResolvedValue([]);
        mocks.evaluateGeofenceTransitions.mockResolvedValue(undefined);

        vehicle = {
            _id: vehicleObjectId,
            vehicleId: "VH-001",
            currentLocation: null,
            currentSpeed: 0,
            lastTelemetryAt: undefined,
            status: "offline",
            batteryLevel: undefined,
            fuelLevel: undefined,
            save: vi.fn().mockResolvedValue(undefined),
        };

        const eventRecord = {
            _id: new Types.ObjectId(),
            vehicleId: vehicleObjectId,
            eventId: "evt-test-001",
            reading,
            status: "pending",
        };

        mocks.workerProcess.mockResolvedValue(reading);
        mocks.vehicleFindOne.mockResolvedValue(vehicle);

        // First lookup: event does not exist.
        // Second lookup: the newly created event is found.
        mocks.eventFindOne
            .mockResolvedValueOnce(null)
            .mockResolvedValue(eventRecord);

        mocks.eventCreate.mockResolvedValue(eventRecord);
        mocks.eventUpdateOne.mockResolvedValue({ modifiedCount: 1 });

        mocks.bucketUpdateOne.mockResolvedValue({ matchedCount: 1 });
        mocks.bucketExists.mockResolvedValue({ _id: new Types.ObjectId() });

        mocks.bucketFindOneAndUpdate.mockResolvedValue({});
        mocks.workerClose.mockResolvedValue(undefined);
        mocks.vehicleUpdateOne.mockResolvedValue({ matchedCount: 1 });
    });


    afterEach(async () => {
        await closeTelemetryWorkerPool();
    });

    it("rounds a timestamp down to the start of its hour", () => {
        const result = getBucketStart(timestamp);

        expect(result.toISOString()).toBe(
            "2026-10-27T12:00:00.000Z",
        );
    });

    it("saves a reading using the hourly bucket pattern", async () => {
        await addTelemetryReading(vehicleObjectId, reading);


        expect(mocks.bucketUpdateOne).toHaveBeenCalledTimes(2);

        expect(mocks.bucketUpdateOne).toHaveBeenNthCalledWith(
            1,
            {
                vehicleId: vehicleObjectId,
                bucketStart: getBucketStart(timestamp),
            },
            {
                $setOnInsert: {
                    vehicleId: vehicleObjectId,
                    bucketStart: getBucketStart(timestamp),
                    readings: [],
                    readingCount: 0,
                },
            },
            { upsert: true }
        );

        expect(mocks.bucketUpdateOne).toHaveBeenNthCalledWith(
            2,
            {
                vehicleId: vehicleObjectId,
                bucketStart: getBucketStart(timestamp),
                "readings.eventId": { $ne: reading.eventId },
            },
            {
                $push: { readings: reading },
                $inc: { readingCount: 1 },
            }
        );

        expect(mocks.bucketExists).toHaveBeenCalledWith({
            vehicleId: vehicleObjectId,
            bucketStart: getBucketStart(timestamp),
            "readings.eventId": reading.eventId,
        });

    });

    it("processes telemetry and updates the vehicle", async () => {
        const result = await processTelemetry({
            eventId: "evt-test-001",
            vehicleId: "VH-001",
            latitude: 22.3072,
            longitude: 73.1812,
            speed: 60,
            heading: 180,
            batteryLevel: 85,
            fuelLevel: 70,
        });

        expect(mocks.vehicleFindOne).toHaveBeenCalledWith({
            vehicleId: "VH-001",
        });

        expect(mocks.workerProcess).toHaveBeenCalledOnce();
        expect(mocks.bucketUpdateOne).toHaveBeenCalledTimes(2);


        expect(mocks.bucketUpdateOne).toHaveBeenCalledTimes(2);

        expect(mocks.vehicleUpdateOne).toHaveBeenCalledWith(
            {
                _id: vehicleObjectId,
                $or: [
                    { lastTelemetryAt: null },
                    { lastTelemetryAt: { $lt: timestamp } },
                ],
            },
            {
                $set: {
                    currentLocation: {
                        latitude: 22.3072,
                        longitude: 73.1812,
                    },
                    currentSpeed: 60,
                    lastTelemetryAt: timestamp,
                    status: "online",
                    batteryLevel: 85,
                    fuelLevel: 70,
                },
            }
        );

        expect(mocks.eventUpdateOne).toHaveBeenCalledWith(
            { _id: expect.any(Types.ObjectId), status: "pending" },
            { $set: { status: "completed" } }
        );


        expect(result).toEqual({
            vehicleId: "VH-001",
            timestamp,
        });
    });

    it("throws VEHICLE_NOT_FOUND when the vehicle does not exist", async () => {
        mocks.vehicleFindOne.mockResolvedValue(null);

        await expect(
            processTelemetry({
                eventId: "evt-test-001",
                vehicleId: "UNKNOWN",
                latitude: 22,
                longitude: 73,
                speed: 30,
            }),
        ).rejects.toThrow("VEHICLE_NOT_FOUND");

        expect(mocks.bucketFindOneAndUpdate).not.toHaveBeenCalled();
        expect(vehicle.save).not.toHaveBeenCalled();
    });

    it("does not update the vehicle when bucket persistence fails", async () => {
        mocks.bucketUpdateOne.mockRejectedValueOnce(
            new Error("Database write failed")
        );

        await expect(
            processTelemetry({
                eventId: "evt-test-001",
                vehicleId: "VH-001",
                latitude: 22,
                longitude: 73,
                speed: 30,
            }),
        ).rejects.toThrow("Database write failed");

        expect(vehicle.save).not.toHaveBeenCalled();
    });

    it("leaves the event pending when the vehicle update fails", async () => {
        mocks.vehicleUpdateOne.mockRejectedValue(
            new Error("Vehicle update failed")
        );

        await expect(
            processTelemetry({
                eventId: "evt-test-001",
                vehicleId: "VH-001",
                latitude: 22,
                longitude: 73,
                speed: 30,
            })
        ).rejects.toThrow("Vehicle update failed");

        expect(mocks.bucketExists).toHaveBeenCalled();
        expect(mocks.eventUpdateOne).not.toHaveBeenCalled();
    });

    it("queries telemetry for the correct vehicle and time range", async () => {
        const start = new Date("2026-10-27T12:15:00.000Z");
        const end = new Date("2026-10-27T14:45:00.000Z");

        const expectedBuckets = [
            { bucketStart: new Date("2026-10-27T12:00:00.000Z") },
            { bucketStart: new Date("2026-10-27T13:00:00.000Z") },
        ];

        const lean = vi.fn().mockResolvedValue(expectedBuckets);
        const sort = vi.fn().mockReturnValue({ lean });

        mocks.bucketFind.mockReturnValue({ sort });

        const result = await getTelemetryByTimeRange(
            vehicleObjectId,
            start,
            end,
        );

        expect(mocks.bucketFind).toHaveBeenCalledWith({
            vehicleId: vehicleObjectId,
            bucketStart: {
                $gte: getBucketStart(start),
                $lte: getBucketStart(end),
            },
        });

        expect(sort).toHaveBeenCalledWith({ bucketStart: 1 });
        expect(lean).toHaveBeenCalledOnce();
        expect(result).toEqual(expectedBuckets);
    });

    it("sorts telemetry buckets in ascending time order", async () => {
        const lean = vi.fn().mockResolvedValue([]);
        const sort = vi.fn().mockReturnValue({ lean });

        mocks.bucketFind.mockReturnValue({ sort });

        await getTelemetryByTimeRange(
            vehicleObjectId,
            new Date("2026-10-27T12:00:00.000Z"),
            new Date("2026-10-27T15:00:00.000Z"),
        );

        expect(sort).toHaveBeenCalledWith({ bucketStart: 1 });
    });

    it("uses UTC hourly boundaries for the requested time range", async () => {
        const start = new Date("2026-10-27T12:34:56.000Z");
        const end = new Date("2026-10-27T14:59:59.000Z");

        const lean = vi.fn().mockResolvedValue([]);
        const sort = vi.fn().mockReturnValue({ lean });

        mocks.bucketFind.mockReturnValue({ sort });

        await getTelemetryByTimeRange(vehicleObjectId, start, end);

        expect(mocks.bucketFind).toHaveBeenCalledWith({
            vehicleId: vehicleObjectId,
            bucketStart: {
                $gte: new Date("2026-10-27T12:00:00.000Z"),
                $lte: new Date("2026-10-27T14:00:00.000Z"),
            },
        });
    });

    it("propagates database query errors", async () => {
        const databaseError = new Error("Telemetry query failed");

        mocks.bucketFind.mockImplementation(() => {
            throw databaseError;
        });

        await expect(
            getTelemetryByTimeRange(
                vehicleObjectId,
                new Date("2026-10-27T12:00:00.000Z"),
                new Date("2026-10-27T14:00:00.000Z"),
            ),
        ).rejects.toThrow("Telemetry query failed");
    });

    it("does not persist a completed event again", async () => {
        const completedEvent = {
            _id: new Types.ObjectId(),
            vehicleId: vehicleObjectId,
            eventId: "evt-test-001",
            reading,
            status: "completed",
        };

        mocks.eventFindOne
            .mockReset()
            .mockResolvedValue(completedEvent);

        const result = await processTelemetry({
            eventId: "evt-test-001",
            vehicleId: "VH-001",
            latitude: 22.3072,
            longitude: 73.1812,
            speed: 60,
        });

        expect(result).toEqual({
            vehicleId: "VH-001",
            timestamp,
        });

        expect(mocks.eventCreate).not.toHaveBeenCalled();
        expect(mocks.bucketUpdateOne).not.toHaveBeenCalled();
        expect(mocks.vehicleUpdateOne).not.toHaveBeenCalled();
    });

    it("reuses the existing event after a duplicate-key race", async () => {
        const existingEvent = {
            _id: new Types.ObjectId(),
            vehicleId: vehicleObjectId,
            eventId: "evt-test-001",
            reading,
            status: "pending",
        };

        mocks.eventFindOne
            .mockReset()
            .mockResolvedValueOnce(null)
            .mockResolvedValue(existingEvent);

        mocks.eventCreate.mockRejectedValue(
            Object.assign(new Error("Duplicate key"), { code: 11000 })
        );

        const result = await processTelemetry({
            eventId: "evt-test-001",
            vehicleId: "VH-001",
            latitude: 22.3072,
            longitude: 73.1812,
            speed: 60,
        });

        expect(result.timestamp).toEqual(timestamp);
        expect(mocks.eventCreate).toHaveBeenCalledOnce();
        expect(mocks.bucketExists).toHaveBeenCalled();
        expect(mocks.eventUpdateOne).toHaveBeenCalledOnce();
    });

    it("recovers a pending event after a failed vehicle update", async () => {
        const pendingEvent = {
            _id: new Types.ObjectId(),
            vehicleId: vehicleObjectId,
            eventId: "evt-test-001",
            reading,
            status: "pending",
        };

        mocks.eventFindOne
            .mockReset()
            .mockResolvedValue(pendingEvent);

        mocks.vehicleUpdateOne
            .mockRejectedValueOnce(new Error("Vehicle update failed"))
            .mockResolvedValue({ matchedCount: 1 });

        const request = {
            eventId: "evt-test-001",
            vehicleId: "VH-001",
            latitude: 22.3072,
            longitude: 73.1812,
            speed: 60,
        };

        await expect(processTelemetry(request))
            .rejects.toThrow("Vehicle update failed");

        expect(mocks.eventUpdateOne).not.toHaveBeenCalled();

        await processTelemetry(request);

        expect(mocks.bucketExists).toHaveBeenCalledTimes(2);
        expect(mocks.vehicleUpdateOne).toHaveBeenCalledTimes(2);
        expect(mocks.eventUpdateOne).toHaveBeenCalledOnce();
    });

    it("uses a timestamp guard so stale telemetry cannot overwrite newer vehicle state", async () => {
        const olderTimestamp = new Date("2026-10-27T10:00:00.000Z");

        const staleReading = {
            ...reading,
            timestamp: olderTimestamp,
        };

        mocks.workerProcess.mockResolvedValue(staleReading);

        mocks.eventFindOne
            .mockReset()
            .mockResolvedValue({
                _id: new Types.ObjectId(),
                vehicleId: vehicleObjectId,
                eventId: "evt-stale-001",
                reading: staleReading,
                status: "pending",
            });

        // MongoDB matches no vehicle because its lastTelemetryAt is newer.
        mocks.vehicleUpdateOne.mockResolvedValue({ matchedCount: 0 });

        await processTelemetry({
            eventId: "evt-stale-001",
            vehicleId: "VH-001",
            latitude: 22.3072,
            longitude: 73.1812,
            speed: 60,
        });

        expect(mocks.vehicleUpdateOne).toHaveBeenCalledWith(
            {
                _id: vehicleObjectId,
                $or: [
                    { lastTelemetryAt: null },
                    { lastTelemetryAt: { $lt: olderTimestamp } },
                ],
            },
            {
                $set: expect.objectContaining({
                    lastTelemetryAt: olderTimestamp,
                }),
            }
        );

        // A stale reading is still retained in history and completed.
        expect(mocks.bucketExists).toHaveBeenCalled();
        expect(mocks.eventUpdateOne).toHaveBeenCalledWith(
            { _id: expect.any(Types.ObjectId), status: "pending" },
            { $set: { status: "completed" } }
        );
    });
    expect(mocks.evaluateGeofenceTransitions).not.toHaveBeenCalled();

    it("retrieves the most recent reading before the given timestamp", async () => {
        const previousReading = {
            ...reading,
            eventId: "evt-previous",
            timestamp: new Date("2026-10-27T11:45:00.000Z"),
        };

        mocks.bucketAggregate.mockResolvedValue([previousReading]);

        const result = await getPreviousTelemetryReading(
            vehicleObjectId,
            timestamp,
        );

        expect(mocks.bucketAggregate).toHaveBeenCalledWith([
            {
                $match: {
                    vehicleId: vehicleObjectId,
                    bucketStart: {
                        $lte: getBucketStart(timestamp),
                    },
                },
            },
            { $unwind: "$readings" },
            {
                $match: {
                    "readings.timestamp": { $lt: timestamp },
                },
            },
            { $sort: { "readings.timestamp": -1 } },
            { $limit: 1 },
            { $replaceRoot: { newRoot: "$readings" } },
        ]);

        expect(result).toEqual(previousReading);
    });

    it("returns null when no previous telemetry reading exists", async () => {
        mocks.bucketAggregate.mockResolvedValue([]);

        const result = await getPreviousTelemetryReading(
            vehicleObjectId,
            timestamp,
        );

        expect(result).toBeNull();
    });


    it("retries geofence evaluation when alert processing previously failed", async () => {
        mocks.evaluateGeofenceTransitions
            .mockRejectedValueOnce(new Error("Alert persistence failed"))
            .mockResolvedValue(undefined);

        const request = {
            eventId: "evt-test-001",
            vehicleId: "VH-001",
            latitude: 22.3072,
            longitude: 73.1812,
            speed: 60,
        };

        // First attempt: vehicle update succeeds, alert processing fails.
        mocks.vehicleUpdateOne
            .mockResolvedValueOnce({ matchedCount: 1 })
            .mockResolvedValueOnce({ matchedCount: 0 });
            
        await expect(processTelemetry(request))
            .rejects.toThrow("Alert persistence failed");

        expect(mocks.eventUpdateOne).not.toHaveBeenCalled();

        // Simulate the vehicle state persisted by the first attempt.
        vehicle.lastTelemetryAt = timestamp;
        vehicle.currentLocation = {
            latitude: reading.latitude,
            longitude: reading.longitude,
        };

        // Second attempt: recognizes the already-updated vehicle
        // and retries geofence evaluation.
        await processTelemetry(request);

        expect(mocks.evaluateGeofenceTransitions).toHaveBeenCalledTimes(2);

        expect(mocks.evaluateGeofenceTransitions).toHaveBeenLastCalledWith(
            expect.objectContaining({
                vehicleId: vehicleObjectId,
                sourceEventId: reading.eventId,
                currentReading: reading,
            }),
        );

        expect(mocks.eventUpdateOne).toHaveBeenCalledOnce();
    });
});
