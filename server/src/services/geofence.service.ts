import { Types } from "mongoose";
import { Geofence } from "../models/geofence.model.js";
import type { IGeofence } from "../types/geofence.types.js";

export type CreateGeofenceInput = Pick<
    IGeofence,
    "name" | "geometry"
> &
    Partial<
        Pick<
            IGeofence,
            "description" | "radius" | "isActive" |
            "alertOnEntry" | "alertOnExit"
        >
    >;

const validateGeofence = (data: Partial<CreateGeofenceInput>): void => {
    if (typeof data.name !== "string" || !data.name.trim()) {
        throw new Error("Geofence name is required");
    }

    const geometry = data.geometry;

    if (!geometry || !["Polygon", "Circle"].includes(geometry.type)) {
        throw new Error("Geometry must be a Polygon or Circle");
    }

    if (geometry.type === "Circle") {
        const [longitude, latitude] = geometry.coordinates;

        if (
            !Number.isFinite(longitude) ||
            !Number.isFinite(latitude) ||
            longitude < -180 ||
            longitude > 180 ||
            latitude < -90 ||
            latitude > 90
        ) {
            throw new Error("Circle coordinates must be [longitude, latitude]");
        }

        if (
            !Number.isFinite(data.radius) ||
            data.radius === undefined ||
            data.radius <= 0
        ) {
            throw new Error("Circle radius must be greater than zero");
        }
    }

    if (geometry.type === "Polygon") {
        const rings = geometry.coordinates;

        if (
            !Array.isArray(rings) ||
            rings.length === 0 ||
            !Array.isArray(rings[0]) ||
            rings[0].length < 4
        ) {
            throw new Error("Polygon must contain a closed ring of at least four points");
        }

        for (const ring of rings) {
            for (const coordinate of ring) {
                if (
                    !Array.isArray(coordinate) ||
                    coordinate.length < 2 ||
                    !Number.isFinite(coordinate[0]) ||
                    !Number.isFinite(coordinate[1]) ||
                    coordinate[0] < -180 ||
                    coordinate[0] > 180 ||
                    coordinate[1] < -90 ||
                    coordinate[1] > 90
                ) {
                    throw new Error("Polygon coordinates must be valid [longitude, latitude] pairs");
                }
            }
        }
    }
};

export const createGeofence = async (
    data: CreateGeofenceInput,
) => {
    validateGeofence(data);
    return Geofence.create(data);
};

export const getGeofences = async () =>
    Geofence.find().sort({ createdAt: -1 }).lean();

export const getGeofenceById = async (id: string) => {
    if (!Types.ObjectId.isValid(id)) {
        return null;
    }

    return Geofence.findById(id).lean();
};

export const updateGeofence = async (
    id: string,
    data: Partial<CreateGeofenceInput>,
) => {
    if (!Types.ObjectId.isValid(id)) {
        return null;
    }

    const existing = await Geofence.findById(id);
    if (!existing) {
        return null;
    }

    const candidate = {
        name: data.name ?? existing.name,
        geometry: data.geometry ?? existing.geometry,
        radius: data.radius ?? existing.radius,
    };

    validateGeofence(candidate);

    Object.assign(existing, data);
    await existing.save();

    return existing;
};

export const deleteGeofence = async (id: string) => {
    if (!Types.ObjectId.isValid(id)) {
        return null;
    }

    return Geofence.findByIdAndDelete(id);
};