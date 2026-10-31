export interface TelemetryRealtimeEvent {
    vehicleId: string;
    eventId: string;
    timestamp: string;
    latitude: number;
    longitude: number;
    speed: number;
    batteryLevel?: number;
    fuelLevel?: number;
}

export interface AlertRealtimeEvent {
    alertId: string;
    vehicleId: string;
    type: string;
    severity: string;
    message: string;
    occurredAt: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}

export const REDIS_CHANNELS = {
    TELEMETRY: "fleetdash:telemetry",
    ALERTS: "fleetdash:alerts",
} as const;

export type RealtimeEvent =
    | {
        channel: typeof REDIS_CHANNELS.TELEMETRY;
        payload: TelemetryRealtimeEvent;
    }
    | {
        channel: typeof REDIS_CHANNELS.ALERTS;
        payload: AlertRealtimeEvent;
    };
