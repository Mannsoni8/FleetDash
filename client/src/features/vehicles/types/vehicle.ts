export interface VehicleLocation {
  latitude: number;
  longitude: number;
}

export type VehicleStatus =
  | "online"
  | "offline"
  | "idle"
  | "maintenance";

export interface Vehicle {
  _id: string;
  vehicleId: string;
  registrationNumber: string;
  driverName: string;
  status: VehicleStatus;
  vehicleType: string;
  currentLocation: VehicleLocation;
  currentSpeed: number;
  batteryLevel?: number;
  fuelLevel?: number;
  lastTelemetryAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleListResponse {
  count: number;
  vehicles: Vehicle[];
}
