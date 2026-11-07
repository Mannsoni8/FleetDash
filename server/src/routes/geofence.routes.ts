import { Router } from "express";
import {
    createGeofenceController,
    deleteGeofenceController,
    getGeofenceByIdController,
    getGeofencesController,
    updateGeofenceController,
} from "../controllers/geofence.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();
router.use(authenticate, authorize("admin", "manager"));

router.post("/", createGeofenceController);
router.get("/", getGeofencesController);
router.get("/:id", getGeofenceByIdController);
router.patch("/:id", updateGeofenceController);
router.delete("/:id", deleteGeofenceController);

export default router;