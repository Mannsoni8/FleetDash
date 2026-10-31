import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { subscribeToRealtimeEvents } from "../pubsub/subscriber.js";

let io: Server | null = null;

export const initializeSocketServer = async (
    httpServer: HttpServer,
): Promise<Server> => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("disconnect", (reason) => {
            console.log(`Socket disconnected: ${socket.id}`, reason);
        });
    });

    await subscribeToRealtimeEvents(({ event, payload }) => {
        io?.emit(event, payload);
    });

    console.log("Socket.IO server initialized");

    return io;
};

export const getSocketServer = (): Server => {
    if (!io) {
        throw new Error("Socket.IO server has not been initialized");
    }

    return io;
};