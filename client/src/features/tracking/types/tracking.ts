export interface TrackingVehicle {
  _id: string;
  vehicleId: string;
  registrationNumber: string;
  driverName: string;
  status: "online" | "offline" | "idle" | "maintenance";
  vehicleType: string;
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  currentSpeed: number;
  lastTelemetryAt?: string;
}