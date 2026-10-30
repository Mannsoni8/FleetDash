import { Router } from "express";
import {
    createGeofenceController,
    deleteGeofenceController,
    getGeofenceByIdController,
    getGeofencesController,
    updateGeofenceController,
} from "../controllers/geofence.controller.js";

const router = Router();

router.post("/", createGeofenceController);
router.get("/", getGeofencesController);
router.get("/:id", getGeofenceByIdController);
router.patch("/:id", updateGeofenceController);
router.delete("/:id", deleteGeofenceController);

export default router;