import { Redis } from "ioredis";
import config from "./env.js";

export const redisPublisher = new Redis(config.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
});

export const redisSubscriber = redisPublisher.duplicate({
    lazyConnect: true,
});

redisPublisher.on("error", (error) => {
    console.error("Redis publisher error:", error.message);
});

redisSubscriber.on("error", (error) => {
    console.error("Redis subscriber error:", error.message);
});

export const connectRedis = async (): Promise<void> => {
    try {
        await Promise.all([
            redisPublisher.connect(),
            redisSubscriber.connect(),
        ]);

        console.log("Redis publisher and subscriber connected");
    } catch (error) {
        console.error("Redis connection failed:", error);
        throw error;
    }
};

export const disconnectRedis = async (): Promise<void> => {
    await Promise.all([
        redisPublisher.quit(),
        redisSubscriber.quit(),
    ]);

    console.log("Redis connections closed");
};
