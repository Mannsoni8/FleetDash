export interface TelemetryUpdate {
  eventId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export type RealtimeAlertSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface AlertCreated {
  alertId: string;
  vehicleId: string;
  type: string;
  severity: RealtimeAlertSeverity;
  message: string;
  occurredAt: string;
}
