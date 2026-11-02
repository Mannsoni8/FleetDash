import { useMemo, useState } from "react";
import {
  Search,
  Truck,
  MapPin,
  Gauge,
  Battery,
  Fuel,
  RefreshCw,
} from "lucide-react";

import type { Vehicle, VehicleStatus } from "../types/vehicle";
import type { TelemetryUpdate } from "../../../types/realtime";

interface VehiclesPageProps {
  vehicles: Vehicle[];
  telemetry: TelemetryUpdate[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const statusStyles: Record<VehicleStatus, string> = {
  online: "bg-emerald-50 text-emerald-700",
  offline: "bg-slate-100 text-slate-600",
  idle: "bg-amber-50 text-amber-700",
  maintenance: "bg-red-50 text-red-700",
};

const VehiclesPage = ({
  vehicles,
  telemetry,
  loading,
  error,
  onRefresh,
}: VehiclesPageProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VehicleStatus>(
    "all",
  );

  const latestTelemetry = useMemo(() => {
    const telemetryMap = new Map<string, TelemetryUpdate>();

    telemetry.forEach((reading) => {
      const existing = telemetryMap.get(reading.vehicleId);

      if (
        !existing ||
        new Date(reading.timestamp).getTime() >
          new Date(existing.timestamp).getTime()
      ) {
        telemetryMap.set(reading.vehicleId, reading);
      }
    });

    return telemetryMap;
  }, [telemetry]);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const query = search.toLowerCase();

    const matchesSearch =
      vehicle.registrationNumber.toLowerCase().includes(query) ||
      vehicle.driverName.toLowerCase().includes(query) ||
      vehicle.vehicleId.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" || vehicle.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getTelemetry = (vehicle: Vehicle) => {
    const liveReading = latestTelemetry.get(vehicle.vehicleId);

    if (
      liveReading &&
      (!vehicle.lastTelemetryAt ||
        new Date(liveReading.timestamp).getTime() >=
          new Date(vehicle.lastTelemetryAt).getTime())
    ) {
      return liveReading;
    }

    return null;
  };

  const formatLocation = (latitude: number, longitude: number) =>
    `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Live Vehicles
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor your registered vehicles and their latest telemetry.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search registration, driver or vehicle ID..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | VehicleStatus)
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="idle">Idle</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && vehicles.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Loading vehicles...
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <Truck className="mx-auto mb-3 text-slate-300" size={36} />
          <h3 className="font-semibold text-slate-700">
            No vehicles found
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Try changing your search or status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {filteredVehicles.map((vehicle) => {
            const live = getTelemetry(vehicle);

            const speed = live?.speed ?? vehicle.currentSpeed;
            const latitude =
              live?.latitude ?? vehicle.currentLocation.latitude;
            const longitude =
              live?.longitude ?? vehicle.currentLocation.longitude;

            return (
              <article
                key={vehicle._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <Truck size={23} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800">
                        {vehicle.registrationNumber}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {vehicle.vehicleType} · {vehicle.driverName}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      statusStyles[vehicle.status]
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Gauge size={17} />
                      <span className="text-xs">Current Speed</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-800">
                      {speed}{" "}
                      <span className="text-sm font-medium text-slate-500">
                        km/h
                      </span>
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin size={17} />
                      <span className="text-xs">Location</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {formatLocation(latitude, longitude)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Battery size={17} />
                      <span className="text-xs">Battery Level</span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-slate-800">
                      {vehicle.batteryLevel ?? "—"}
                      {vehicle.batteryLevel != null ? "%" : ""}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Fuel size={17} />
                      <span className="text-xs">Fuel Level</span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-slate-800">
                      {vehicle.fuelLevel ?? "—"}
                      {vehicle.fuelLevel != null ? "%" : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-1 border-t border-slate-100 pt-4 text-xs text-slate-400 sm:flex-row sm:justify-between">
                  <span>Vehicle ID: {vehicle.vehicleId}</span>
                  <span>
                    {live
                      ? "Live telemetry received"
                      : vehicle.lastTelemetryAt
                        ? `Last update: ${new Date(vehicle.lastTelemetryAt).toLocaleString()}`
                        : "No telemetry timestamp"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VehiclesPage;