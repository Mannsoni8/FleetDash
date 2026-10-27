import { afterEach, describe, expect, it } from "vitest";
import { TelemetryWorkerPool } from "../../src/workers/worker-pool.js";

describe("TelemetryWorkerPool", () => {
    let pool: TelemetryWorkerPool | undefined;

    afterEach(async () => {
        await pool?.close();
        pool = undefined;
    });

    it("processes telemetry and returns the correct reading", async () => {
        pool = new TelemetryWorkerPool(1, 10);

        const reading = await pool.process({
            vehicleId: "VH-001",
            latitude: 22.3072,
            longitude: 73.1812,
            speed: 60,
            heading: 180,
            batteryLevel: 85,
            fuelLevel: 70,
            timestamp: "2026-10-27T12:00:00.000Z",
        });

        expect(reading).toMatchObject({
            latitude: 22.3072,
            longitude: 73.1812,
            speed: 60,
            heading: 180,
            batteryLevel: 85,
            fuelLevel: 70,
        });

        expect(reading.timestamp.toISOString()).toBe(
            "2026-10-27T12:00:00.000Z",
        );
    });

    it("processes multiple requests", async () => {
        pool = new TelemetryWorkerPool(2, 10);

        const readings = await Promise.all([
            pool.process({
                vehicleId: "VH-001",
                latitude: 20,
                longitude: 70,
                speed: 30,
            }),
            pool.process({
                vehicleId: "VH-002",
                latitude: 21,
                longitude: 71,
                speed: 40,
            }),
        ]);

        expect(readings).toHaveLength(2);
        expect(readings.map((reading) => reading.speed)).toEqual([30, 40]);
    });

    it("rejects new tasks after shutdown", async () => {
        pool = new TelemetryWorkerPool(1, 10);
        await pool.close();

        await expect(
            pool.process({
                vehicleId: "VH-001",
                latitude: 20,
                longitude: 70,
                speed: 30,
            }),
        ).rejects.toThrow("Telemetry worker pool is closed");
    });

    it("rejects an invalid worker pool size", () => {
        expect(() => new TelemetryWorkerPool(0, 10)).toThrow(
            "Worker pool size must be a positive integer",
        );
    });

    it("rejects tasks when the queue is full", async () => {
        pool = new TelemetryWorkerPool(1, 1);

        const firstTask = pool.process({
            vehicleId: "VH-001",
            latitude: 20,
            longitude: 70,
            speed: 30,
        });

        const secondTask = pool.process({
            vehicleId: "VH-002",
            latitude: 21,
            longitude: 71,
            speed: 40,
        });

        // The first task occupies the worker; the second fills the queue.
        // A third task should be rejected because the queue is full.
        const thirdTask = pool.process({
            vehicleId: "VH-003",
            latitude: 22,
            longitude: 72,
            speed: 50,
        });

        await expect(thirdTask).rejects.toThrow(
            "Telemetry worker queue is full",
        );

        await Promise.all([firstTask, secondTask]);
    });
});