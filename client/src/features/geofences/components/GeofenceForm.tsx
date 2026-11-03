import { useState } from "react";
import type { CreateGeofenceInput, GeofenceType } from "../types/geofence";

interface GeofenceFormProps {
  onSubmit: (data: CreateGeofenceInput) => Promise<void>;
  onCancel: () => void;
}

const GeofenceForm = ({ onSubmit, onCancel }: GeofenceFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GeofenceType>("Circle");
  const [latitude, setLatitude] = useState("22.3072");
  const [longitude, setLongitude] = useState("73.1812");
  const [radius, setRadius] = useState("500");
  const [polygonPoints, setPolygonPoints] = useState(
    "73.1800,22.3060\n73.1820,22.3060\n73.1820,22.3080\n73.1800,22.3080"
  );
  const [alertOnEntry, setAlertOnEntry] = useState(true);
  const [alertOnExit, setAlertOnExit] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      let geometry;

      if (type === "Circle") {
        const lat = Number(latitude);
        const lng = Number(longitude);
        const radiusValue = Number(radius);

        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180 ||
          !Number.isFinite(radiusValue) ||
          radiusValue <= 0
        ) {
          throw new Error("Enter valid coordinates and a positive radius.");
        }

        geometry = {
          type: "Circle" as const,
          coordinates: [lng, lat] as [number, number],
        };
      } else {
        const points = polygonPoints
          .trim()
          .split("\n")
          .map((line) => {
            const values = line.split(",").map((value) => Number(value.trim()));

            if (
              values.length !== 2 ||
              !Number.isFinite(values[0]) ||
              !Number.isFinite(values[1]) ||
              values[0] < -180 ||
              values[0] > 180 ||
              values[1] < -90 ||
              values[1] > 90
            ) {
              throw new Error("Each polygon point must be longitude,latitude.");
            }

            return values;
          });

        if (points.length < 3) {
          throw new Error("Polygon needs at least 3 points.");
        }

        const ring = [...points, points[0]];

        geometry = {
          type: "Polygon" as const,
          coordinates: [ring],
        };
      }

      const data: CreateGeofenceInput = {
        name: name.trim(),
        description: description.trim(),
        geometry,
        ...(type === "Circle" ? { radius: Number(radius) } : {}),
        isActive,
        alertOnEntry,
        alertOnExit,
      };

      setSubmitting(true);
      await onSubmit(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create geofence."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">
          Create Geofence
        </h2>
        <p className="text-sm text-slate-500">
          Define a geographical boundary for your fleet.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Warehouse Zone"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Geometry Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as GeofenceType)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option value="Circle">Circle</option>
          <option value="Polygon">Polygon</option>
        </select>
      </div>

      {type === "Circle" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Latitude</label>
            <input
              type="number"
              step="any"
              required
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Longitude</label>
            <input
              type="number"
              step="any"
              required
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Radius (m)</label>
            <input
              type="number"
              min="1"
              required
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium">
            Polygon Points (longitude,latitude)
          </label>
          <textarea
            required
            rows={5}
            value={polygonPoints}
            onChange={(e) => setPolygonPoints(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Enter at least 3 points, one per line. The first point will be
            automatically repeated to close the polygon.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Geofence Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={alertOnEntry}
            onChange={(e) => setAlertOnEntry(e.target.checked)}
          />
          Alert on Entry
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={alertOnExit}
            onChange={(e) => setAlertOnExit(e.target.checked)}
          />
          Alert on Exit
        </label>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Geofence"}
        </button>
      </div>
    </form>
  );
};

export default GeofenceForm;
