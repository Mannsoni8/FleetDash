import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

const mocks = vi.hoisted(() => ({
    vehicleFindOne: vi.fn(),
    bucketFindOneAndUpdate: vi.fn(),
    bucketFind: vi.fn(),
    workerProcess: vi.fn(),
    workerClose: vi.fn(),
}));

vi.mock("../../src/models/vehicle.model.js", () => ({
    Vehicle: {
        findOne: mocks.vehicleFindOne,
    },
}));

vi.mock("../../src/models/telemetry.model.js", () => ({
    TelemetryBucket: {
        findOneAndUpdate: mocks.bucketFindOneAndUpdate,
        find: mocks.bucketFind,
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
    processTelemetry,
} from "../../src/services/telemetry.service.js";

describe("Telemetry service", () => {
    const timestamp = new Date("2026-10-27T12:34:56.000Z");
    const vehicleObjectId = new Types.ObjectId();

    const reading = {
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

        mocks.workerProcess.mockResolvedValue(reading);
        mocks.vehicleFindOne.mockResolvedValue(vehicle);
        mocks.bucketFindOneAndUpdate.mockResolvedValue({});
        mocks.workerClose.mockResolvedValue(undefined);
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

        expect(mocks.bucketFindOneAndUpdate).toHaveBeenCalledWith(
            {
                vehicleId: vehicleObjectId,
                bucketStart: getBucketStart(timestamp),
            },
            {
                $push: { readings: reading },
                $inc: { readingCount: 1 },
            },
            {
                upsert: true,
                returnDocument: "after",
            },
        );
    });

    it("processes telemetry and updates the vehicle", async () => {
        const result = await processTelemetry({
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
        expect(mocks.bucketFindOneAndUpdate).toHaveBeenCalledOnce();

        expect(vehicle.currentLocation).toEqual({
            latitude: 22.3072,
            longitude: 73.1812,
        });
        expect(vehicle.currentSpeed).toBe(60);
        expect(vehicle.lastTelemetryAt).toEqual(timestamp);
        expect(vehicle.status).toBe("online");
        expect(vehicle.batteryLevel).toBe(85);
        expect(vehicle.fuelLevel).toBe(70);
        expect(vehicle.save).toHaveBeenCalledOnce();

        expect(result).toEqual({
            vehicleId: "VH-001",
            timestamp,
        });
    });

    it("throws VEHICLE_NOT_FOUND when the vehicle does not exist", async () => {
        mocks.vehicleFindOne.mockResolvedValue(null);

        await expect(
            processTelemetry({
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
        mocks.bucketFindOneAndUpdate.mockRejectedValue(
            new Error("Database write failed"),
        );

        await expect(
            processTelemetry({
                vehicleId: "VH-001",
                latitude: 22,
                longitude: 73,
                speed: 30,
            }),
        ).rejects.toThrow("Database write failed");

        expect(vehicle.save).not.toHaveBeenCalled();
    });

    it("propagates an error when saving the vehicle fails", async () => {
        vehicle.save.mockRejectedValue(new Error("Vehicle save failed"));

        await expect(
            processTelemetry({
                vehicleId: "VH-001",
                latitude: 22,
                longitude: 73,
                speed: 30,
            }),
        ).rejects.toThrow("Vehicle save failed");

        expect(mocks.bucketFindOneAndUpdate).toHaveBeenCalledOnce();
    });
});
