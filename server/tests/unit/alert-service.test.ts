import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

const mocks = vi.hoisted(() => ({
    alertUpdateOne: vi.fn(),
    publishRealtimeEvent: vi.fn(),
}));

vi.mock("../../src/models/alert.model.js", () => ({
    Alert: {
        updateOne: mocks.alertUpdateOne,
    },
}));

vi.mock("../../src/pubsub/publisher.js", () => ({
    publishRealtimeEvent: mocks.publishRealtimeEvent,
}));

import { createGeofenceTransitionAlert } from "../../src/services/alert.service.js";
import { REALTIME_EVENTS } from "../../src/types/realtime.types.js";

describe("Geofence transition alert publishing", () => {
    const vehicleId = new Types.ObjectId();
    const geofenceId = new Types.ObjectId();
    const occurredAt = new Date("2026-10-31T10:00:00.000Z");

    const alertData = {
        vehicleId,
        geofenceId,
        sourceEventId: "event-123",
        transition: "entry" as const,
        geofenceName: "Warehouse",
        latitude: 22.3072,
        longitude: 73.1812,
        occurredAt,
    };

    beforeEach(() => {
        vi.resetAllMocks();
        mocks.alertUpdateOne.mockResolvedValue({
            acknowledged: true,
            upsertedCount: 1,
            upsertedId: new Types.ObjectId(),
        });
        mocks.publishRealtimeEvent.mockResolvedValue(undefined);
    });

    it("publishes when a new alert is inserted", async () => {
        await createGeofenceTransitionAlert(alertData);

        expect(mocks.publishRealtimeEvent).toHaveBeenCalledOnce();

        expect(mocks.publishRealtimeEvent).toHaveBeenCalledWith(
            REALTIME_EVENTS.ALERT_CREATED,
            expect.objectContaining({
                vehicleId: vehicleId.toString(),
                type: "geofence_breach",
                severity: "medium",
                message: "Vehicle entered geofence: Warehouse",
                occurredAt: occurredAt.toISOString(),
            }),
        );
    });

    it("does not publish when the alert already exists", async () => {
        mocks.alertUpdateOne.mockResolvedValue({
            acknowledged: true,
            upsertedCount: 0,
        });

        await createGeofenceTransitionAlert(alertData);

        expect(mocks.publishRealtimeEvent).not.toHaveBeenCalled();
    });

    it("does not throw when Redis publishing fails", async () => {
        mocks.publishRealtimeEvent.mockRejectedValue(
            new Error("Redis unavailable"),
        );

        await expect(
            createGeofenceTransitionAlert(alertData),
        ).resolves.toBeUndefined();
    });

    it("does not throw on a duplicate-key race", async () => {
        mocks.alertUpdateOne.mockRejectedValue({ code: 11000 });

        await expect(
            createGeofenceTransitionAlert(alertData),
        ).resolves.toBeUndefined();

        expect(mocks.publishRealtimeEvent).not.toHaveBeenCalled();
    });
});