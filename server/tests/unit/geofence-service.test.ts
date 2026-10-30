import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

const mocks = vi.hoisted(() => ({
    geofenceFind: vi.fn(),
    alertUpdateOne: vi.fn(),
}));

vi.mock("../../src/models/geofence.model.js", () => ({
    Geofence: {
        find: mocks.geofenceFind,
    },
}));

vi.mock("../../src/models/alert.model.js", () => ({
    Alert: {
        updateOne: mocks.alertUpdateOne,
    },
}));

import { evaluateGeofenceTransitions } from "../../src/services/geofence.service.js";

describe("Geofence transition evaluator", () => {
    const vehicleId = new Types.ObjectId();
    const geofenceId = new Types.ObjectId();

    const geofence = {
        _id: geofenceId,
        name: "Warehouse",
        geometry: {
            type: "Circle" as const,
            coordinates: [73.1812, 22.3072] as [number, number],
        },
        radius: 100,
        isActive: true,
        alertOnEntry: true,
        alertOnExit: true,
    };

    const previousReading = {
        eventId: "previous-event",
        timestamp: new Date("2026-10-30T10:00:00.000Z"),
        latitude: 22.3100,
        longitude: 73.1812,
        speed: 40,
    };

    const currentReading = {
        eventId: "current-event",
        timestamp: new Date("2026-10-30T10:05:00.000Z"),
        latitude: 22.3072,
        longitude: 73.1812,
        speed: 40,
    };

    beforeEach(() => {
        vi.resetAllMocks();

        mocks.geofenceFind.mockReturnValue({
            lean: vi.fn().mockResolvedValue([geofence]),
        });

        mocks.alertUpdateOne.mockResolvedValue({
            acknowledged: true,
            upsertedCount: 1,
        });
    });

    it("creates an entry alert when a vehicle enters a geofence", async () => {
        await evaluateGeofenceTransitions({
            vehicleId,
            sourceEventId: "current-event",
            previousReading,
            currentReading,
        });

        expect(mocks.alertUpdateOne).toHaveBeenCalledOnce();

        expect(mocks.alertUpdateOne).toHaveBeenCalledWith(
            expect.objectContaining({
                vehicleId,
                geofenceId,
                sourceEventId: "current-event",
                transition: "entry",
            }),
            expect.any(Object),
            { upsert: true },
        );
    });

    it("creates an exit alert when a vehicle leaves a geofence", async () => {
        await evaluateGeofenceTransitions({
            vehicleId,
            sourceEventId: "exit-event",
            previousReading: currentReading,
            currentReading: previousReading,
        });

        expect(mocks.alertUpdateOne).toHaveBeenCalledOnce();

        expect(mocks.alertUpdateOne).toHaveBeenCalledWith(
            expect.objectContaining({
                transition: "exit",
            }),
            expect.any(Object),
            { upsert: true },
        );
    });

    it("does not create an alert when both positions are inside", async () => {
        await evaluateGeofenceTransitions({
            vehicleId,
            sourceEventId: "inside-event",
            previousReading: currentReading,
            currentReading: {
                ...currentReading,
                latitude: 22.3075,
            },
        });

        expect(mocks.alertUpdateOne).not.toHaveBeenCalled();
    });

    it("does not create an alert when both positions are outside", async () => {
        await evaluateGeofenceTransitions({
            vehicleId,
            sourceEventId: "outside-event",
            previousReading,
            currentReading: {
                ...previousReading,
                latitude: 22.3110,
            },
        });

        expect(mocks.alertUpdateOne).not.toHaveBeenCalled();
    });

    it("does not create an alert when there is no previous reading", async () => {
        await evaluateGeofenceTransitions({
            vehicleId,
            sourceEventId: "first-event",
            previousReading: null,
            currentReading,
        });

        expect(mocks.geofenceFind).not.toHaveBeenCalled();
        expect(mocks.alertUpdateOne).not.toHaveBeenCalled();
    });

    it("respects disabled entry alerts", async () => {
        mocks.geofenceFind.mockReturnValue({
            lean: vi.fn().mockResolvedValue([
                { ...geofence, alertOnEntry: false },
            ]),
        });

        await evaluateGeofenceTransitions({
            vehicleId,
            sourceEventId: "disabled-entry",
            previousReading,
            currentReading,
        });

        expect(mocks.alertUpdateOne).not.toHaveBeenCalled();
    });

    it("respects disabled exit alerts", async () => {
        mocks.geofenceFind.mockReturnValue({
            lean: vi.fn().mockResolvedValue([
                { ...geofence, alertOnExit: false },
            ]),
        });

        await evaluateGeofenceTransitions({
            vehicleId,
            sourceEventId: "disabled-exit",
            previousReading: currentReading,
            currentReading: previousReading,
        });

        expect(mocks.alertUpdateOne).not.toHaveBeenCalled();
    });
});
