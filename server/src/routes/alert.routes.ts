import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import {
    getAlertsController,
    getAlertByIdController,
    getAlertsByVehicleController,
    resolveAlertController,
} from "../controllers/alert.controller.js";

const router = Router();
router.use(authenticate, authorize("admin", "manager"));

router.get("/", getAlertsController);
router.get("/vehicle/:vehicleId", getAlertsByVehicleController);
router.get("/:id", getAlertByIdController);
router.patch("/:id/resolve", resolveAlertController);

export default router;
