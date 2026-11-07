import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { subscribeToRealtimeEvents } from "../pubsub/subscriber.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import config from "../config/env.js";

let io: Server | null = null;

export const initializeSocketServer = async (
    httpServer: HttpServer,
): Promise<Server> => {
    io = new Server(httpServer, {
        cors: {
            origin: config.CLIENT_URL,
            credentials: true,
        },
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (typeof token !== "string" || !token) {
                next(new Error("Authentication required"));
                return;
            }
            const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
            if (typeof decoded === "string" || typeof decoded.sub !== "string") {
                next(new Error("Invalid access token"));
                return;
            }
            const user = await User.findById(decoded.sub).select("_id role isActive");
            if (!user?.isActive || !["admin", "manager"].includes(user.role)) {
                next(new Error("Account is disabled or unavailable"));
                return;
            }
            socket.data.user = { id: user._id.toString(), role: user.role };
            next();
        } catch {
            next(new Error("Invalid or expired access token"));
        }
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
