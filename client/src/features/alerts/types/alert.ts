export interface AlertLocation {
  latitude: number;
  longitude: number;
}

export interface AlertVehicle {
  _id: string;
  vehicleId: string;
}

export type AlertSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type AlertTransition = "entry" | "exit";

export interface AlertVehicle {
  _id: string;
  vehicleId: string;
}

export interface Alert {
  _id: string;
  vehicleId: AlertVehicle | string;
  sourceEventId: string;
  geofenceId: string;
  transition: AlertTransition;
  type: string;
  severity: AlertSeverity;
  message: string;
  location: AlertLocation;
  occurredAt: string;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlertPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AlertListResponse {
  alerts: Alert[];
  pagination: AlertPagination;
}
