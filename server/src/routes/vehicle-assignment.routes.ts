import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

import {
  assignVehicleController,
  getVehicleAssignmentHistoryController,
  unassignVehicleController,
} from "../controllers/vehicle-assignment.controller.js";

const router = Router();

router.use(authenticate, authorize("admin", "manager"));

router.post("/:vehicleId/assign", assignVehicleController);
router.post("/:vehicleId/unassign", unassignVehicleController);
router.get("/:vehicleId/history", getVehicleAssignmentHistoryController);

export default router;
