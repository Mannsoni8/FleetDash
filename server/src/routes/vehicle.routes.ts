import { Router } from "express";
import {
    createVehicleController,
    getVehicleByIdController,
    getVehiclesController,
} from "../controllers/vehicle.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();
router.use(authenticate, authorize("admin", "manager"));

router.get("/", getVehiclesController);
router.post("/", createVehicleController);
router.get("/:vehicleId", getVehicleByIdController);

export default router;