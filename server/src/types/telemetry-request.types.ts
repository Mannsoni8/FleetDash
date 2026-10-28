export interface TelemetryRequestBody {
    eventId: string;
    vehicleId: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading?: number;
    batteryLevel?: number;
    fuelLevel?: number;
    timestamp?: string;
}