import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/database.js";
import config from "./config/env.js";
import { closeTelemetryWorkerPool } from "./services/telemetry.service.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";

await connectDB();
await connectRedis();

const server = app.listen(config.PORT, () => {
    console.log(`Server is running on ${config.PORT}`);
});

let shuttingDown = false;

const shutdown = (signal: string): void => {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    console.log(`${signal} received. Shutting down gracefully...`);

    server.close((serverError) => {
        void (async () => {
            try {
                await closeTelemetryWorkerPool();
                await disconnectRedis();
                await mongoose.disconnect();
                
                console.log("Server, workers and database closed");
            } catch (error) {
                console.error("Error during shutdown:", error);
                process.exitCode = 1;
            }

            if (serverError) {
                console.error("HTTP server shutdown error:", serverError);
                process.exitCode = 1;
            }
        })();
    });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
