import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  vehicleFindOne: vi.fn(),
  userFindById: vi.fn(),
  assignmentCreate: vi.fn(),
  assignmentFindOneAndUpdate: vi.fn(),
  assignmentFind: vi.fn(),
}));

vi.mock("../../src/models/vehicle.model.js", () => ({ Vehicle: { findOne: mocks.vehicleFindOne } }));
vi.mock("../../src/models/user.model.js", () => ({ User: { findById: mocks.userFindById } }));
vi.mock("../../src/models/vehicle-assignment.model.js", () => ({
  VehicleAssignment: {
    create: mocks.assignmentCreate,
    findOneAndUpdate: mocks.assignmentFindOneAndUpdate,
    find: mocks.assignmentFind,
  },
}));

import {
  assignVehicleToDriver,
  getVehicleAssignmentHistory,
  unassignVehicleFromDriver,
} from "../../src/services/vehicle-assignment.service.js";

describe("vehicle assignment service", () => {
  const vehicleObjectId = "507f1f77bcf86cd799439011";
  const driverId = "507f1f77bcf86cd799439012";
  const managerId = "507f1f77bcf86cd799439013";

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.vehicleFindOne.mockResolvedValue({ _id: vehicleObjectId });
    mocks.userFindById.mockImplementation(async (id: string) => ({
      _id: id,
      role: id === driverId ? "driver" : "manager",
      isActive: true,
    }));
  });

  it("creates an assignment for an active driver and manager", async () => {
    const assignment = { _id: "assignment" };
    mocks.assignmentCreate.mockResolvedValue(assignment);

    await expect(assignVehicleToDriver("VH-1", driverId, managerId)).resolves.toBe(assignment);
    expect(mocks.assignmentCreate).toHaveBeenCalledWith(expect.objectContaining({
      vehicle: vehicleObjectId,
      driver: driverId,
      assignedBy: managerId,
      status: "active",
    }));
  });

  it("turns a unique-index conflict into a conflict error", async () => {
    mocks.assignmentCreate.mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));
    await expect(assignVehicleToDriver("VH-1", driverId, managerId))
      .rejects.toThrow("VEHICLE_OR_DRIVER_ALREADY_ASSIGNED");
  });

  it("marks the active assignment complete while preserving history", async () => {
    const assignment = { status: "completed" };
    mocks.assignmentFindOneAndUpdate.mockResolvedValue(assignment);
    await expect(unassignVehicleFromDriver("VH-1")).resolves.toBe(assignment);
    expect(mocks.assignmentFindOneAndUpdate).toHaveBeenCalledWith(
      { vehicle: vehicleObjectId, status: "active" },
      { $set: expect.objectContaining({ status: "completed", unassignedAt: expect.any(Date) }) },
      { new: true, runValidators: true },
    );
  });

  it("returns assignment history in newest-first order", async () => {
    const lean = vi.fn().mockResolvedValue([]);
    const sort = vi.fn().mockReturnValue({ lean });
    const populateByAssigner = vi.fn().mockReturnValue({ sort });
    const populateByDriver = vi.fn().mockReturnValue({ populate: populateByAssigner });
    mocks.assignmentFind.mockReturnValue({ populate: populateByDriver });

    await expect(getVehicleAssignmentHistory("VH-1")).resolves.toEqual([]);
    expect(sort).toHaveBeenCalledWith({ assignedAt: -1 });
  });
});
