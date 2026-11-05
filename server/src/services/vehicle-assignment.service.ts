import mongoose from "mongoose";

import { User } from "../models/user.model.js";
import { Vehicle } from "../models/vehicle.model.js";
import { VehicleAssignment } from "../models/vehicle-assignment.model.js";

export const assignVehicleToDriver = async (
    vehicleId: string,
    driverId: string,
    assignedBy: string
) => {
    if (
        !mongoose.Types.ObjectId.isValid(driverId) ||
        !mongoose.Types.ObjectId.isValid(assignedBy)
    ) {
        throw new Error("INVALID_USER_ID");
    }

    const [vehicle, driver, manager] = await Promise.all([
        Vehicle.findOne({ vehicleId }),
        User.findById(driverId),
        User.findById(assignedBy),
    ]);

    if (!vehicle) {
        throw new Error("VEHICLE_NOT_FOUND");
    }

    if (!driver || driver.role !== "driver" || !driver.isActive) {
        throw new Error("INVALID_DRIVER");
    }

    if (
        !manager ||
        !manager.isActive ||
        !["admin", "manager"].includes(manager.role)
    ) {
        throw new Error("INVALID_ASSIGNING_USER");
    }

    try {
        const assignment = await VehicleAssignment.create({
            vehicle: vehicle._id,
            driver: driver._id,
            assignedBy: manager._id,
            status: "active",
        });

        return assignment;
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            throw new Error("VEHICLE_OR_DRIVER_ALREADY_ASSIGNED");
        }

        throw error;
    }
};

export const unassignVehicleFromDriver = async (
    vehicleId: string,
) => {
    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
        throw new Error("VEHICLE_NOT_FOUND");
    }

    const assignment = await VehicleAssignment.findOneAndUpdate(
        { vehicle: vehicle._id, status: "active" },
        { $set: { status: "completed", unassignedAt: new Date() } },
        { new: true, runValidators: true },
    );

    if (!assignment) {
        throw new Error("ACTIVE_ASSIGNMENT_NOT_FOUND");
    }

    return assignment;
};

export const getVehicleAssignmentHistory = async (vehicleId: string) => {
    const vehicle = await Vehicle.findOne({ vehicleId });
    if (!vehicle) {
        throw new Error("VEHICLE_NOT_FOUND");
    }

    return VehicleAssignment.find({ vehicle: vehicle._id })
        .populate("driver", "name email")
        .populate("assignedBy", "name email")
        .sort({ assignedAt: -1 })
        .lean();
};
