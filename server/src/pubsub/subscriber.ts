import { redisSubscriber } from "../config/redis.js";

const CHANNEL = "fleetdash:realtime";

export interface RealtimeMessage {
    event: string;
    payload: unknown;
    publishedAt: string;
}

type RealtimeMessageHandler = (
    message: RealtimeMessage,
) => void | Promise<void>;

export const subscribeToRealtimeEvents = async (
    handler: RealtimeMessageHandler,
): Promise<void> => {
    await redisSubscriber.subscribe(CHANNEL);

    redisSubscriber.on("message", (channel, message) => {
        if (channel !== CHANNEL) return;

        try {
            const parsed = JSON.parse(message) as RealtimeMessage;

            Promise.resolve(handler(parsed)).catch((error: unknown) => {
                console.error("Realtime message handler failed:", error);
            });
        } catch (error) {
            console.error("Invalid realtime message:", error);
        }
    });

    console.log(`Subscribed to Redis channel: ${CHANNEL}`);
};