export type GeofenceType = "Circle" | "Polygon";

export interface CircleGeometry {
  type: "Circle";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface PolygonGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

export type GeofenceGeometry =
  | CircleGeometry
  | PolygonGeometry;

export interface Geofence {
  _id: string;
  name: string;
  description?: string;
  geometry: GeofenceGeometry;
  radius?: number;
  isActive: boolean;
  alertOnEntry: boolean;
  alertOnExit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceListResponse {
  count: number;
  geofences: Geofence[];
}

export interface CreateGeofenceInput {
  name: string;
  description?: string;
  geometry: GeofenceGeometry;
  radius?: number;
  isActive?: boolean;
  alertOnEntry?: boolean;
  alertOnExit?: boolean;
}