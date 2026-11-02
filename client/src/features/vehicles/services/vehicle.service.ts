import api from "../../../lib/axios";
import type { VehicleListResponse } from "../types/vehicle";

export const getVehicles = async (): Promise<VehicleListResponse> => {
  const response = await api.get<VehicleListResponse>("/vehicles");

  return response.data;
};
