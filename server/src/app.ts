import express from "express";
import telemetryRouter from "./routes/telemetry.routes.js";
import vehicleRouter from "./routes/vehicle.routes.js";
import geofenceRouter from "./routes/geofence.routes.js";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use("/api/telemetry", telemetryRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/geofences", geofenceRouter);

app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
) => {
    if (error instanceof SyntaxError && "body" in error) {
        res.status(400).json({ message: "Invalid JSON request body" });
        return;
    }

    console.error("Unhandled request error:", error);
    res.status(500).json({ message: "Internal server error" });
});

export default app;