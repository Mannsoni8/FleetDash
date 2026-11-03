import { useState } from "react";
import type {
  Geofence,
  CreateGeofenceInput,
} from "../types/geofence";

interface GeofenceEditFormProps {
  geofence: Geofence;
  onSave: (id: string, data: Partial<CreateGeofenceInput>) => Promise<void>;
  onCancel: () => void;
}

const GeofenceEditForm = ({
  geofence,
  onSave,
  onCancel,
}: GeofenceEditFormProps) => {
  const [name, setName] = useState(geofence.name);
  const [description, setDescription] = useState(
    geofence.description || ""
  );
  const [isActive, setIsActive] = useState(geofence.isActive);
  const [alertOnEntry, setAlertOnEntry] = useState(
    geofence.alertOnEntry
  );
  const [alertOnExit, setAlertOnExit] = useState(
    geofence.alertOnExit
  );

  const [latitude, setLatitude] = useState(
    geofence.geometry.type === "Circle"
      ? String(geofence.geometry.coordinates[1])
      : ""
  );

  const [longitude, setLongitude] = useState(
    geofence.geometry.type === "Circle"
      ? String(geofence.geometry.coordinates[0])
      : ""
  );

  const [radius, setRadius] = useState(String(geofence.radius || 500));

  const [polygonPoints, setPolygonPoints] = useState(
    geofence.geometry.type === "Polygon"
      ? geofence.geometry.coordinates[0]
          .slice(0, -1)
          .map(([lng, lat]) => `${lng},${lat}`)
          .join("\n")
      : ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Geofence name is required.");
      return;
    }

    try {
      let geometry = geofence.geometry;
      let radiusValue: number | undefined;

      if (geofence.geometry.type === "Circle") {
        const lat = Number(latitude);
        const lng = Number(longitude);
        radiusValue = Number(radius);

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
          throw new Error("Enter valid coordinates and radius.");
        }

        geometry = {
          type: "Circle",
          coordinates: [lng, lat],
        };
      } else {
        const points = polygonPoints
          .trim()
          .split("\n")
          .map((line) => {
            const values = line.split(",").map((v) => Number(v.trim()));

            if (
              values.length !== 2 ||
              !Number.isFinite(values[0]) ||
              !Number.isFinite(values[1]) ||
              values[0] < -180 ||
              values[0] > 180 ||
              values[1] < -90 ||
              values[1] > 90
            ) {
              throw new Error("Use longitude,latitude for every point.");
            }

            return values;
          });

        if (points.length < 3) {
          throw new Error("Polygon needs at least 3 points.");
        }

        geometry = {
          type: "Polygon",
          coordinates: [[...points, points[0]]],
        };
      }

      setLoading(true);

      await onSave(geofence._id, {
        name: name.trim(),
        description: description.trim(),
        geometry,
        ...(radiusValue !== undefined ? { radius: radiusValue } : {}),
        isActive,
        alertOnEntry,
        alertOnExit,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update geofence."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4"
    >
      <h3 className="font-semibold text-slate-800">
        Edit {geofence.name}
      </h3>

      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Description
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
        />
      </div>

      {geofence.geometry.type === "Circle" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Latitude"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="Longitude"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
          <input
            type="number"
            min="1"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            placeholder="Radius (m)"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2"
          />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium">
            Polygon Points (longitude,latitude)
          </label>
          <textarea
            rows={5}
            value={polygonPoints}
            onChange={(e) => setPolygonPoints(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm"
          />
        </div>
      )}

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Active
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={alertOnEntry}
            onChange={(e) => setAlertOnEntry(e.target.checked)}
          />
          Alert on Entry
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={alertOnExit}
            onChange={(e) => setAlertOnExit(e.target.checked)}
          />
          Alert on Exit
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default GeofenceEditForm;
