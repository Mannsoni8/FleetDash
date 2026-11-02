import { io } from "socket.io-client";
import mongoose from "mongoose";
import { Vehicle } from "../src/models/vehicle.model.js";
import { Geofence } from "../src/models/geofence.model.js";
import { Alert } from "../src/models/alert.model.js";
import { TelemetryBucket } from "../src/models/telemetry.model.js";
import { TelemetryEvent } from "../src/models/telemetry-event.model.js";
import config from "../src/config/env.js";

const BASE_URL = "http://localhost:3000";
const suffix = `${Date.now()}`;

const vehicleId = `e2e-vehicle-${suffix}`;
const registrationNumber = `E2E-${suffix}`;

let createdVehicleId: mongoose.Types.ObjectId | undefined;
let createdGeofenceId: mongoose.Types.ObjectId | undefined;

const socket = io(BASE_URL, {
    transports: ["websocket"],
    reconnection: false,
});

const waitForAlert = (): Promise<Record<string, unknown>> => {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.off("alert:created", onAlert);
            reject(new Error("Timed out waiting for alert:created"));
        }, 15000);

        const onAlert = (payload: unknown) => {
            clearTimeout(timeout);
            resolve(payload as Record<string, unknown>);
        };

        socket.once("alert:created", onAlert);
    });
};
const postJson = async (path: string, body: unknown) => {
    const response = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const responseBody = await response.json();

    if (!response.ok) {
        throw new Error(
            `${path} failed (${response.status}): ${JSON.stringify(responseBody)}`,
        );
    }
    console.log("POST:", path);
    console.log("STATUS:", response.status);
    console.log("RESPONSE:", responseBody);

    return responseBody;
};

const sendTelemetry = async (
    eventId: string,
    latitude: number,
    longitude: number,
    timestamp: Date,
) => {
    return postJson("/api/telemetry", {
        eventId,
        vehicleId,
        latitude,
        longitude,
        speed: 40,
        timestamp: timestamp.toISOString(),
    });
};

const main = async () => {
    try {
        await mongoose.connect(config.MONGO_URI);
        console.log("Test database connection established");

        await new Promise<void>((resolve, reject) => {
            socket.once("connect", () => {
                console.log("Socket.IO client connected:", socket.id);
                resolve();
            });

            socket.once("connect_error", reject);
        });

        // Create an isolated test vehicle.
        const vehicleResponse = await postJson("/api/vehicles", {
            vehicleId,
            registrationNumber,
            driverName: "E2E Test Driver",
            vehicleType: "truck",
            currentLocation: {
                latitude: 22.3100,
                longitude: 73.1812,
            },
        });

        createdVehicleId = new mongoose.Types.ObjectId(
            vehicleResponse.vehicle._id,
        );

        console.log("Test vehicle created");

        // Create a 100-metre circular geofence.
        const geofenceResponse = await postJson("/api/geofences", {
            name: `FleetDash E2E Warehouse ${suffix}`,
            geometry: {
                type: "Circle",
                coordinates: [73.1812, 22.3072],
            },
            radius: 100,
            isActive: true,
            alertOnEntry: true,
            alertOnExit: true,
        });

        createdGeofenceId = new mongoose.Types.ObjectId(
            geofenceResponse.geofence._id,
        );

        console.log("Test geofence created");

        const baseTime = Date.now();

        // First reading: outside the geofence.
        await sendTelemetry(
            `e2e-outside-${suffix}`,
            22.3100,
            73.1812,
            new Date(baseTime),
        );

        console.log("Outside telemetry accepted");

        // Second reading: inside the geofence.
        const insideTime = new Date(baseTime + 60_000);

        const alertPromise = waitForAlert();

        await sendTelemetry(
            `e2e-inside-${suffix}`,
            22.3072,
            73.1812,
            insideTime,
        );

        console.log("Inside telemetry accepted");

        const receivedAlert = await alertPromise;;

        console.log("Socket.IO alert received:", receivedAlert);

        if (
            receivedAlert.vehicleId !== vehicleId ||
            receivedAlert.type !== "geofence_breach" ||
            receivedAlert.message !==
            `Vehicle entered geofence: FleetDash E2E Warehouse ${suffix}`
        ) {
            throw new Error("Received alert payload did not match expectations");
        }

        // Verify the alert was persisted in MongoDB.
        const storedAlert = await Alert.findOne({
            vehicleId: createdVehicleId,
            geofenceId: createdGeofenceId,
            sourceEventId: `e2e-inside-${suffix}`,
            transition: "entry",
        }).lean();

        if (!storedAlert) {
            throw new Error("Alert was not persisted in MongoDB");
        }

        console.log("MongoDB alert persistence verified");
        console.log("\nEND-TO-END GEOFENCE TEST PASSED");
    } finally {
        socket.disconnect();

        if (createdVehicleId) {
            await Promise.all([
                Alert.deleteMany({ vehicleId: createdVehicleId }),
                TelemetryBucket.deleteMany({
                    vehicleId: createdVehicleId,
                }),
                TelemetryEvent.deleteMany({
                    vehicleId: createdVehicleId,
                }),
            ]);
        }

        if (createdGeofenceId) {
            await Geofence.deleteOne({ _id: createdGeofenceId });
        }

        if (createdVehicleId) {
            await Vehicle.deleteOne({ _id: createdVehicleId });
        }
        
        await mongoose.disconnect();

        console.log("Test data cleanup completed");
    }
};

main().catch((error: unknown) => {
    console.error("E2E test failed:", error);
    process.exitCode = 1;
});