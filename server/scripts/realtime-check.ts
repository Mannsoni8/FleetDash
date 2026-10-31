import { io } from "socket.io-client";
import { redisPublisher } from "../src/config/redis.js";

const socket = io("http://localhost:3000", {
    transports: ["websocket"],
});

socket.on("connect", async () => {
    console.log("Client connected:", socket.id);

    socket.once("telemetry:update", (payload) => {
        console.log("Received telemetry:", payload);
        socket.disconnect();
        process.exit(0);
    });

    await redisPublisher.publish(
        "fleetdash:realtime",
        JSON.stringify({
            event: "telemetry:update",
            payload: {
                vehicleId: "test-vehicle-123",
                latitude: 28.6139,
                longitude: 77.2090,
                speed: 65,
                timestamp: new Date().toISOString(),
            },
            publishedAt: new Date().toISOString(),
        }),
    );
});

socket.on("connect_error", (error) => {
    console.error("Socket connection failed:", error.message);
    process.exit(1);
});

setTimeout(() => {
    console.error("Test timed out");
    socket.disconnect();
    process.exit(1);
}, 5000);