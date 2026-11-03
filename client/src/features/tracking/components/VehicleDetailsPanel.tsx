import { MapPin, Gauge, User, Truck, X } from "lucide-react";
import type { TrackingVehicle } from "../types/tracking";

interface VehicleDetailsPanelProps {
  vehicle: TrackingVehicle | null;
  onClose: () => void;
}

const VehicleDetailsPanel = ({
  vehicle,
  onClose,
}: VehicleDetailsPanelProps) => {
  if (!vehicle) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
        <MapPin className="mx-auto mb-3 text-slate-400" size={28} />
        <p className="font-medium text-slate-700">Select a vehicle</p>
        <p className="mt-1 text-sm text-slate-500">
          Click a vehicle marker to view its details.
        </p>
      </div>
    );
  }

  const statusColors = {
    online: "bg-green-100 text-green-700",
    offline: "bg-slate-100 text-slate-700",
    idle: "bg-yellow-100 text-yellow-700",
    maintenance: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {vehicle.registrationNumber}
          </h2>
          <p className="text-sm text-slate-500">{vehicle.vehicleId}</p>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>

      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColors[vehicle.status]}`}>
        {vehicle.status}
      </span>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-3">
          <User className="text-slate-400" size={18} />
          <div>
            <p className="text-xs text-slate-400">Driver</p>
            <p className="text-sm font-medium text-slate-700">
              {vehicle.driverName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Truck className="text-slate-400" size={18} />
          <div>
            <p className="text-xs text-slate-400">Vehicle Type</p>
            <p className="text-sm font-medium text-slate-700">
              {vehicle.vehicleType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Gauge className="text-slate-400" size={18} />
          <div>
            <p className="text-xs text-slate-400">Current Speed</p>
            <p className="text-sm font-medium text-slate-700">
              {vehicle.currentSpeed} km/h
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="text-slate-400" size={18} />
          <div>
            <p className="text-xs text-slate-400">Coordinates</p>
            <p className="text-sm font-medium text-slate-700">
              {vehicle.currentLocation.latitude.toFixed(5)},{" "}
              {vehicle.currentLocation.longitude.toFixed(5)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetailsPanel;
