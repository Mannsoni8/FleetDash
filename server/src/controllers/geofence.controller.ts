import type { Request, Response } from "express";
import {
    createGeofence,
    deleteGeofence,
    getGeofenceById,
    getGeofences,
    updateGeofence,
    type CreateGeofenceInput,
} from "../services/geofence.service.js";

const handleError = (res: Response, error: unknown): void => {
    const message =
        error instanceof Error ? error.message : "Unexpected server error";

    if (
        message.includes("required") ||
        message.includes("must") ||
        message.includes("Geometry") ||
        message.includes("Polygon coordinates")
    ) {
        res.status(400).json({ message });
        return;
    }

    console.error("Geofence error:", error);
    res.status(500).json({ message: "Geofence operation failed" });
};

export const createGeofenceController = async (
    req: Request<unknown, unknown, CreateGeofenceInput>,
    res: Response,
): Promise<void> => {
    try {
        const geofence = await createGeofence(req.body);
        res.status(201).json({ message: "Geofence created", geofence });
    } catch (error) {
        handleError(res, error);
    }
};

export const getGeofencesController = async (
    _req: Request,
    res: Response,
): Promise<void> => {
    try {
        const geofences = await getGeofences();
        res.status(200).json({ count: geofences.length, geofences });
    } catch (error) {
        handleError(res, error);
    }
};

export const getGeofenceByIdController = async (
    req: Request<{ id: string }>,
    res: Response,
): Promise<void> => {
    try {
        const geofence = await getGeofenceById(req.params.id);

        if (!geofence) {
            res.status(404).json({ message: "Geofence not found" });
            return;
        }

        res.status(200).json({ geofence });
    } catch (error) {
        handleError(res, error);
    }
};

export const updateGeofenceController = async (
    req: Request<{ id: string }, unknown, Partial<CreateGeofenceInput>>,
    res: Response,
): Promise<void> => {
    try {
        const geofence = await updateGeofence(req.params.id, req.body);

        if (!geofence) {
            res.status(404).json({ message: "Geofence not found" });
            return;
        }

        res.status(200).json({ message: "Geofence updated", geofence });
    } catch (error) {
        handleError(res, error);
    }
};

export const deleteGeofenceController = async (
    req: Request<{ id: string }>,
    res: Response,
): Promise<void> => {
    try {
        const geofence = await deleteGeofence(req.params.id);

        if (!geofence) {
            res.status(404).json({ message: "Geofence not found" });
            return;
        }

        res.status(200).json({ message: "Geofence deleted" });
    } catch (error) {
        handleError(res, error);
    }
};