import { redisPublisher } from "../config/redis.js";
import {
    REALTIME_EVENTS,
    type RealtimeEventMap,
} from "../types/realtime.types.js";

const CHANNEL = "fleetdash:realtime";

export const publishRealtimeEvent = async <
    K extends keyof RealtimeEventMap
>(
    event: K,
    payload: RealtimeEventMap[K],
): Promise<void> => {
    const message = JSON.stringify({
        event,
        payload,
        publishedAt: new Date().toISOString(),
    });

    await redisPublisher.publish(CHANNEL, message);
};