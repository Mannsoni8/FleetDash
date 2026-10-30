import { Router } from "express";
import {
    getAlertsController,
    getAlertByIdController,
    getAlertsByVehicleController,
    resolveAlertController,
} from "../controllers/alert.controller.js";

const router = Router();

router.get("/", getAlertsController);
router.get("/vehicle/:vehicleId", getAlertsByVehicleController);
router.get("/:id", getAlertByIdController);
router.patch("/:id/resolve", resolveAlertController);

export default router;