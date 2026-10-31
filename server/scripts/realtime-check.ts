import { io } from "socket.io-client";
import { redisPublisher } from "../src/config/redis.js";

const socket = io("http://localhost:3000", {
    transports: ["websocket"],
});

const timeout = setTimeout(() => {
    console.error("Realtime test timed out");
    socket.disconnect();
    process.exit(1);
}, 10000);

socket.on("connect", async () => {
    console.log("Client connected:", socket.id);

    try {
        // Test 1: Telemetry event
        const telemetryReceived = new Promise<void>((resolve) => {
            socket.once("telemetry:update", (payload) => {
                console.log("Received telemetry:", payload);
                resolve();
            });
        });

        await redisPublisher.publish(
            "fleetdash:realtime",
            JSON.stringify({
                event: "telemetry:update",
                payload: {
                    eventId: "test-event-123",
                    vehicleId: "test-vehicle-123",
                    latitude: 28.6139,
                    longitude: 77.2090,
                    speed: 65,
                    timestamp: new Date().toISOString(),
                },
                publishedAt: new Date().toISOString(),
            }),
        );

        await telemetryReceived;
        console.log("Telemetry realtime test passed");

        // Test 2: Alert created event
        const alertReceived = new Promise<void>((resolve) => {
            socket.once("alert:created", (payload) => {
                console.log("Received alert:", payload);
                resolve();
            });
        });

        await redisPublisher.publish(
            "fleetdash:realtime",
            JSON.stringify({
                event: "alert:created",
                payload: {
                    alertId: "test-alert-123",
                    vehicleId: "test-vehicle-123",
                    type: "geofence_breach",
                    severity: "medium",
                    message: "Vehicle entered geofence: Warehouse",
                    occurredAt: new Date().toISOString(),
                },
                publishedAt: new Date().toISOString(),
            }),
        );

        await alertReceived;
        console.log("Alert realtime test passed");

        clearTimeout(timeout);
        socket.disconnect();
        await redisPublisher.quit();

        console.log("\nAll realtime tests passed!");
        process.exit(0);
    } catch (error) {
        clearTimeout(timeout);
        console.error("Realtime test failed:", error);
        socket.disconnect();
        process.exit(1);
    }
});

socket.on("connect_error", (error) => {
    clearTimeout(timeout);
    console.error("Socket connection failed:", error.message);
    process.exit(1);
});
