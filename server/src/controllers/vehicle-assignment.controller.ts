import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import {
  assignVehicleToDriver,
  getVehicleAssignmentHistory,
  unassignVehicleFromDriver,
} from "../services/vehicle-assignment.service.js";

const sendAssignmentError = (res: Response, error: unknown): void => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const statuses: Record<string, number> = {
    VEHICLE_NOT_FOUND: 404,
    INVALID_DRIVER: 400,
    INVALID_USER_ID: 400,
    INVALID_ASSIGNING_USER: 403,
    VEHICLE_OR_DRIVER_ALREADY_ASSIGNED: 409,
    ACTIVE_ASSIGNMENT_NOT_FOUND: 404,
  };
  const status = statuses[message];
  if (status) {
    res.status(status).json({ message });
    return;
  }
  console.error("Vehicle assignment error:", error);
  res.status(500).json({ message: "Vehicle assignment operation failed" });
};

export const assignVehicleController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { vehicleId } = req.params;
    const { driverId } = req.body;

    if (
      typeof vehicleId !== "string" ||
      !vehicleId.trim() ||
      typeof driverId !== "string" ||
      !driverId.trim()
    ) {
      res.status(400).json({
        message: "Vehicle ID and driver ID are required",
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        message: "Authentication required",
      });
      return;
    }

    const assignment = await assignVehicleToDriver(
      vehicleId.trim(),
      driverId.trim(),
      req.user.id
    );

    res.status(201).json({
      message: "Vehicle assigned successfully",
      assignment,
    });
  } catch (error) {
    sendAssignmentError(res, error);
  }
};

export const unassignVehicleController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const vehicleId = req.params.vehicleId;
    if (typeof vehicleId !== "string") {
      res.status(400).json({ message: "Vehicle ID is required" });
      return;
    }
    const assignment = await unassignVehicleFromDriver(vehicleId);
    res.status(200).json({ message: "Vehicle unassigned successfully", assignment });
  } catch (error) {
    sendAssignmentError(res, error);
  }
};

export const getVehicleAssignmentHistoryController = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const vehicleId = req.params.vehicleId;
    if (typeof vehicleId !== "string") {
      res.status(400).json({ message: "Vehicle ID is required" });
      return;
    }
    const assignments = await getVehicleAssignmentHistory(vehicleId);
    res.status(200).json({ assignments });
  } catch (error) {
    sendAssignmentError(res, error);
  }
};
