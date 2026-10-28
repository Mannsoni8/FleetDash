import type { GeofenceGeometry } from "../types/geofence.types.js";

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

const isValidPoint = (point: GeoPoint): boolean =>
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180;

export const isPointInsideGeofence = (
    point: GeoPoint,
    geometry: GeofenceGeometry,
    radius?: number,
): boolean => {
    if (!isValidPoint(point)) {
        return false;
    }

    const [longitude, latitude] = geometry.coordinates;

    if (geometry.type === "Circle") {
        if (
            !Number.isFinite(radius) ||
            radius === undefined ||
            radius <= 0
        ) {
            return false;
        }

        const earthRadius = 6_371_000;
        const toRadians = (degrees: number) =>
            (degrees * Math.PI) / 180;

        const lat1 = toRadians(point.latitude);
        const lat2 = toRadians(latitude as number);
        const deltaLat = lat2 - lat1;
        const deltaLon = toRadians(
            (longitude as number) - point.longitude,
        );

        const a =
            Math.sin(deltaLat / 2) ** 2 +
            Math.cos(lat1) *
                Math.cos(lat2) *
                Math.sin(deltaLon / 2) ** 2;

        const distance =
            2 *
            earthRadius *
            Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return distance <= radius;
    }

    const rings = geometry.coordinates as number[][][];

    if (!Array.isArray(rings) || !Array.isArray(rings[0])) {
        return false;
    }

    const ring = rings[0];
    if (ring.length < 4) {
        return false;
    }

    // GeoJSON coordinates are [longitude, latitude].
    const x = point.longitude;
    const y = point.latitude;
    let inside = false;

    for (
        let i = 0, j = ring.length - 1;
        i < ring.length;
        j = i++
    ) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];

        const crosses =
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (crosses) {
            inside = !inside;
        }
    }

    return inside;
};