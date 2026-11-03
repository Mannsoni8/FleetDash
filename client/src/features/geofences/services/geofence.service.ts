import api from "../../../lib/axios";

import type {
  Geofence,
  GeofenceListResponse,
  CreateGeofenceInput,
} from "../types/geofence";

export const getGeofences = async (): Promise<GeofenceListResponse> => {
  const response = await api.get<GeofenceListResponse>("/geofences");
  return response.data;
};

export const createGeofence = async (
  data: CreateGeofenceInput
): Promise<{ message: string; geofence: Geofence }> => {
  const response = await api.post("/geofences", data);
  return response.data;
};

export const deleteGeofence = async (
  geofenceId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/geofences/${geofenceId}`);
  return response.data;
};

export const updateGeofence = async (
  geofenceId: string,
  data: Partial<CreateGeofenceInput>
): Promise<{ message: string; geofence: Geofence }> => {
  const response = await api.patch(`/geofences/${geofenceId}`, data);
  return response.data;
};