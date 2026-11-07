import { useState } from "react";
import { MapPin, Truck, Activity, Wifi, Shield } from "lucide-react";

import FleetMap from "../components/FleetMap";
import VehicleDetailsPanel from "../components/VehicleDetailsPanel";
import { useVehicleTracking } from "../hooks/useVehicleTracking";
import { useGeofences } from "../../geofences/hooks/useGeofences";

const TrackingPage = () => {
  const { vehicles, loading, error } = useVehicleTracking();

  const {
    geofences,
    loading: geofencesLoading,
    error: geofencesError,
  } = useGeofences();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );

  const [selectedGeofenceId, setSelectedGeofenceId] = useState<string | null>(
    null,
  );

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.vehicleId === selectedVehicleId) ?? null;

  const onlineVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "online",
  ).length;

  const activeGeofences = geofences.filter(
    (geofence) => geofence.isActive,
  ).length;

  const handleSelectGeofence = (geofenceId: string) => {
    setSelectedVehicleId(null);
    setSelectedGeofenceId((current) =>
      current === geofenceId ? null : geofenceId,
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Live Vehicle Tracking
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor your fleet locations and vehicle activity in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Truck size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Vehicles</p>
              <h2 className="text-2xl font-bold text-slate-800">
                {vehicles.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <Wifi size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Online Vehicles</p>
              <h2 className="text-2xl font-bold text-slate-800">
                {onlineVehicles}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Selected Vehicle</p>
              <h2 className="text-lg font-bold text-slate-800">
                {selectedVehicle?.vehicleId ?? "None"}
              </h2>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <Shield size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Geofences</p>
              <h2 className="text-2xl font-bold text-slate-800">
                {activeGeofences}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {geofencesError && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          Geofence error: {geofencesError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin size={19} className="text-blue-600" />
              <h2 className="font-semibold text-slate-800">
                Fleet Location Map
              </h2>
            </div>

            <span className="text-xs text-slate-500">
              {geofencesLoading
                ? "Loading geofences..."
                : `${activeGeofences} active geofences`}
            </span>
          </div>

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
              Loading vehicle locations...
            </div>
          ) : (
            <FleetMap
              vehicles={vehicles}
              selectedVehicleId={selectedVehicleId}
              onSelectVehicle={(id) => {
                setSelectedGeofenceId(null);
                setSelectedVehicleId(id);
              }}
              geofences={geofences}
              selectedGeofenceId={selectedGeofenceId}
            />
          )}
        </div>

        <div>
          <h2 className="mb-3 font-semibold text-slate-800">
            Vehicle Information
          </h2>

          <VehicleDetailsPanel
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicleId(null)}
          />

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-slate-800">
              Fleet Vehicles
            </h3>

            <div className="space-y-2">
              {vehicles.map((vehicle) => (
                <button
                  key={vehicle.vehicleId}
                  onClick={() => setSelectedVehicleId(vehicle.vehicleId)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedVehicleId === vehicle.vehicleId
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-100 hover:bg-slate-50"
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">
                      {vehicle.registrationNumber}
                    </span>

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        vehicle.status === "online"
                          ? "bg-green-500"
                          : vehicle.status === "idle"
                            ? "bg-yellow-500"
                            : vehicle.status === "maintenance"
                              ? "bg-orange-500"
                              : "bg-slate-400"
                      }`}
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    {vehicle.vehicleId} · {vehicle.currentSpeed} km/h
                  </p>
                </button>
              ))}

              {vehicles.length === 0 && (
                <p className="text-sm text-slate-500">No vehicles available.</p>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-slate-800">
              Geofence Zones
            </h3>

            <div className="space-y-2">
              {geofences
                .filter((geofence) => geofence.isActive)
                .map((geofence) => (
                  <button
                    key={geofence._id}
                    onClick={() => handleSelectGeofence(geofence._id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedGeofenceId === geofence._id
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">
                        {geofence.name}
                      </span>

                      <MapPin
                        size={16}
                        className={
                          selectedGeofenceId === geofence._id
                            ? "text-blue-600"
                            : "text-slate-400"
                        }
                      />
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {geofence.geometry.type} geofence
                      {geofence.geometry.type === "Circle"
                        ? ` · ${geofence.radius} m`
                        : ""}
                    </p>
                  </button>
                ))}

              {activeGeofences === 0 && (
                <p className="text-sm text-slate-500">
                  No active geofences available.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
