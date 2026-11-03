import { MapPin, Trash2, Bell, BellOff } from "lucide-react";
import type { Geofence } from "../types/geofence";

interface GeofenceListProps {
  geofences: Geofence[];
  onDelete: (id: string) => void;
}

const GeofenceList = ({ geofences, onDelete }: GeofenceListProps) => {
  if (geofences.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <MapPin className="mx-auto mb-3 text-slate-400" size={28} />
        <p className="font-medium text-slate-700">
          No geofences created yet
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Create a geofence to monitor vehicle entry and exit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {geofences.map((geofence) => (
        <div
          key={geofence._id}
          className="rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-800">
                {geofence.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {geofence.description || "No description"}
              </p>
            </div>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to delete ${geofence.name}?`
                  )
                ) {
                  onDelete(geofence._id);
                }
              }}
              className="rounded-lg p-2 text-red-500 hover:bg-red-50"
              title="Delete geofence"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                geofence.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {geofence.isActive ? "Active" : "Inactive"}
            </span>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {geofence.geometry.type}
            </span>

            {geofence.geometry.type === "Circle" && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                Radius: {geofence.radius} m
              </span>
            )}
          </div>

          <div className="mt-4 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              {geofence.alertOnEntry ? (
                <Bell size={14} className="text-green-600" />
              ) : (
                <BellOff size={14} />
              )}
              Entry alert
            </span>

            <span className="flex items-center gap-1">
              {geofence.alertOnExit ? (
                <Bell size={14} className="text-green-600" />
              ) : (
                <BellOff size={14} />
              )}
              Exit alert
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GeofenceList;
