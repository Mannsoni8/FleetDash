import { Shield, RefreshCw } from "lucide-react";
import { useGeofences } from "../hooks/useGeofences";
import GeofenceList from "../components/GeofenceList";
import GeofenceEditForm from "../components/GeofenceEditForm";
import { useState } from "react";
import GeofenceForm from "../components/GeofenceForm";
import {
  createGeofence,
  updateGeofence,
} from "../services/geofence.service";
import type {
  CreateGeofenceInput,
  Geofence,
} from "../types/geofence";

const GeofencesPage = () => {
  const {
    geofences,
    loading,
    error,
    refetch,
    removeGeofence,
  } = useGeofences();

  const [showForm, setShowForm] = useState(false);
  const [selectedGeofence, setSelectedGeofence] =
    useState<Geofence | null>(null);

  const handleCreate = async (data: CreateGeofenceInput) => {
    await createGeofence(data);
    await refetch();
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    const success = await removeGeofence(id);

    if (success) {
      await refetch();
    }
  };

  const handleUpdate = async (
    id: string,
    data: Partial<CreateGeofenceInput>
  ) => {
    await updateGeofence(id, data);
    await refetch();
    setSelectedGeofence(null);
  };

  const handleEdit = (geofence: Geofence) => {
    setShowForm(false);
    setSelectedGeofence(geofence);
  };

  const activeCount = geofences.filter(
    (geofence) => geofence.isActive
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Geofence Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage geographical boundaries and vehicle entry/exit alerts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void refetch()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={() => {
              setSelectedGeofence(null);
              setShowForm(true);
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Create Geofence
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Geofences</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-800">
            {geofences.length}
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active Geofences</p>
          <h2 className="mt-2 text-3xl font-bold text-green-600">
            {activeCount}
          </h2>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Shield size={19} className="text-blue-600" />
          <h2 className="font-semibold text-slate-800">
            Your Geofences
          </h2>
        </div>

        {showForm && (
          <GeofenceForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {selectedGeofence && (
          <GeofenceEditForm
            geofence={selectedGeofence}
            onSave={handleUpdate}
            onCancel={() => setSelectedGeofence(null)}
          />
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading geofences...
          </div>
        ) : (
          <GeofenceList
            geofences={geofences}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
      </div>
    </div>
  );
};

export default GeofencesPage;
