import { describe, expect, it } from "vitest";
import { isPointInsideGeofence } from "../../src/geospatial/geofence.engine.js";

describe("isPointInsideGeofence", () => {
    const circle = {
        type: "Circle",
        coordinates: [72.5714, 23.0225],
    } as const;

    const polygon = {
        type: "Polygon",
        coordinates: [[
            [72, 23],
            [73, 23],
            [73, 24],
            [72, 24],
            [72, 23],
        ]],
    } as const;

    it("detects a point inside a circle", () => {
        expect(
            isPointInsideGeofence(
                { latitude: 23.0225, longitude: 72.5714 },
                circle,
                500,
            ),
        ).toBe(true);
    });

    it("detects a point outside a circle", () => {
        expect(
            isPointInsideGeofence(
                { latitude: 24, longitude: 74 },
                circle,
                500,
            ),
        ).toBe(false);
    });

    it("detects a point inside a polygon", () => {
        expect(
            isPointInsideGeofence(
                { latitude: 23.5, longitude: 72.5 },
                polygon,
            ),
        ).toBe(true);
    });

    it("detects a point outside a polygon", () => {
        expect(
            isPointInsideGeofence(
                { latitude: 25, longitude: 75 },
                polygon,
            ),
        ).toBe(false);
    });

    it("rejects invalid geographic coordinates", () => {
        expect(
            isPointInsideGeofence(
                { latitude: 100, longitude: 72 },
                circle,
                500,
            ),
        ).toBe(false);
    });

    it("rejects a circle without a positive radius", () => {
        expect(
            isPointInsideGeofence(
                { latitude: 23.0225, longitude: 72.5714 },
                circle,
                0,
            ),
        ).toBe(false);
    });
});