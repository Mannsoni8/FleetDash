import type { Types } from "mongoose";

export type AssignmentStatus = "active" | "completed";

export interface IVehicleAssignment {
  vehicle: Types.ObjectId;
  driver: Types.ObjectId;
  assignedBy: Types.ObjectId;
  assignedAt: Date;
  unassignedAt: Date | null;
  status: AssignmentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}