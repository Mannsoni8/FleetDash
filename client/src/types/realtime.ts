export interface TelemetryUpdate {
  eventId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export interface AlertCreated {
  alertId: string;
  vehicleId: string;
  type: string;
  severity: string;
  message: string;
  occurredAt: string;
}