import type { Request, Response } from "express";
import {
    getAlerts,
    getAlertById,
    getAlertsByVehicle,
    resolveAlert,
    type GetAlertsFilters,
} from "../services/alert.service.js";

const handleError = (res: Response, error: unknown): void => {
    const message =
        error instanceof Error ? error.message : "Unexpected server error";

    if (message.startsWith("Invalid")) {
        res.status(400).json({ message });
        return;
    }

    if (
        message === "Alert not found" ||
        message === "Alert not found or already resolved"
    ) {
        res.status(404).json({ message });
        return;
    }

    console.error("Alert error:", error);
    res.status(500).json({ message: "Alert operation failed" });
};

const parsePositiveInteger = (
    value: unknown,
    fallback: number,
    maximum: number,
): number => {
    if (value === undefined) return fallback;

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
       throw new Error(`Invalid pagination value. Must be an integer between 1 and ${maximum}`);
    }
    
    return parsed;
};

export const getAlertsController = async (
    req: Request,
    res: Response,
): Promise<void> => {
    try {
        const page = parsePositiveInteger(req.query.page, 1, 1000000);
        const limit = parsePositiveInteger(req.query.limit, 20, 100);

        const resolvedValue = req.query.resolved;
        let resolved: boolean | undefined;

        if (resolvedValue !== undefined) {
            if (resolvedValue !== "true" && resolvedValue !== "false") {
                res.status(400).json({
                    message: "resolved must be true or false",
                });
                return;
            }

            resolved = resolvedValue === "true";
        }

        const filters: GetAlertsFilters = {
            page,
            limit,
        };
        const validSeverities = ["low", "medium", "high", "critical"] as const;

        const validTypes = [
            "geofence_breach",
            "overspeed",
            "vehicle_offline",
            "telemetry_anomaly",
        ] as const;

        if (req.query.severity !== undefined) {
            if (
                typeof req.query.severity !== "string" ||
                !validSeverities.includes(
                    req.query.severity as (typeof validSeverities)[number],
                )
            ) {
                res.status(400).json({
                    message: "Invalid severity value",
                });
                return;
            }

            filters.severity = req.query.severity as NonNullable<GetAlertsFilters["severity"]>;
        }

        if (req.query.type !== undefined) {
            if (
                typeof req.query.type !== "string" ||
                !validTypes.includes(
                    req.query.type as (typeof validTypes)[number],
                )
            ) {
                res.status(400).json({
                    message: "Invalid alert type",
                });
                return;
            }

            filters.type = req.query.type as NonNullable<GetAlertsFilters["type"]>;
        }

        if (typeof req.query.vehicleId === "string") {
            filters.vehicleId = req.query.vehicleId;
        }

        if (resolved !== undefined) {
            filters.resolved = resolved;
        }

        const result = await getAlerts(filters);

        res.status(200).json(result);
    } catch (error) {
        handleError(res, error);
    }
};

export const getAlertByIdController = async (
    req: Request<{ id: string }>,
    res: Response,
): Promise<void> => {
    try {
        const alert = await getAlertById(req.params.id);

        if (!alert) {
            res.status(404).json({ message: "Alert not found" });
            return;
        }

        res.status(200).json({ alert });
    } catch (error) {
        handleError(res, error);
    }
};

export const getAlertsByVehicleController = async (
    req: Request<{ vehicleId: string }>,
    res: Response,
): Promise<void> => {
    try {
        const page = parsePositiveInteger(req.query.page, 1, 1000000);
        const limit = parsePositiveInteger(req.query.limit, 20, 100);

        const result = await getAlertsByVehicle(
            req.params.vehicleId,
            page,
            limit,
        );

        res.status(200).json(result);
    } catch (error) {
        handleError(res, error);
    }
};

export const resolveAlertController = async (
    req: Request<{ id: string }>,
    res: Response,
): Promise<void> => {
    try {
        const alert = await resolveAlert(req.params.id);

        if (!alert) {
            res.status(404).json({
                message: "Alert not found or already resolved",
            });
            return;
        }

        res.status(200).json({
            message: "Alert resolved successfully",
            alert,
        });
    } catch (error) {
        handleError(res, error);
    }
};