import mongoose from "mongoose";
import config from "../src/config/env.js";
import { Alert } from "../src/models/alert.model.js";
import { Vehicle } from "../src/models/vehicle.model.js";

const main = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log("Database connected");

        const vehicles = await Vehicle.find({
            vehicleId: /^e2e-vehicle-/,
        }).lean();

        const alerts = await Alert.find({
            message: /Vehicle entered geofence/,
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        console.log("\nVehicles:", vehicles);
        console.log("\nAlerts:", alerts);
    } catch (error) {
        console.error("Database check failed:", error);
    } finally {
        await mongoose.disconnect();
    }
};

main();
