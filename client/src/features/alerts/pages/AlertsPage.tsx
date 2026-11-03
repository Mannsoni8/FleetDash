import { useEffect, useState } from "react";
import {
  Search,
  Bell,
  RefreshCw,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

import type { Alert, AlertSeverity } from "../types/alert";
import type { AlertFilters } from "../services/alert.service";

import type { AlertCreated } from "../../../types/realtime";
import { resolveAlert } from "../services/alert.service";

interface AlertsPageProps {
  alerts: Alert[];
  realtimeAlerts: AlertCreated[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  filters: AlertFilters;
  onUpdateFilters: (newFilters: {
    resolved?: boolean | null;
    severity?: AlertSeverity | null;
    vehicleId?: string;
  }) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onRefresh: () => void;
}

const severityStyles: Record<AlertSeverity, string> = {
  low: "bg-blue-50 text-blue-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

const AlertsPage = ({
  alerts,
  realtimeAlerts,
  loading,
  error,
  page,
  totalPages,
  total,
  filters,
  onUpdateFilters,
  onNextPage,
  onPreviousPage,
  onRefresh,
}: AlertsPageProps) => {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [vehicleIdInput, setVehicleIdInput] = useState(filters.vehicleId ?? "");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const searchValue = vehicleIdInput.trim();
      const appliedValue = filters.vehicleId ?? "";

      if (searchValue !== appliedValue) {
        onUpdateFilters({ vehicleId: vehicleIdInput });
      }
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [vehicleIdInput, filters.vehicleId, onUpdateFilters]);

  const handleResolve = async (alertId: string) => {
    try {
      setResolvingId(alertId);
      setActionError(null);

      await resolveAlert(alertId);
      await onRefresh();
    } catch (error) {
      console.error("Failed to resolve alert:", error);
      setActionError("Unable to resolve alert. Please try again.");
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Alerts & Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor vehicle alerts and manage their resolution.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Realtime Alerts */}
      <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={19} className="text-blue-600" />
          <h2 className="font-semibold text-slate-800">Live Incoming Alerts</h2>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {realtimeAlerts.length}
          </span>
        </div>

        {realtimeAlerts.length === 0 ? (
          <p className="text-sm text-slate-500">
            No new realtime alerts received.
          </p>
        ) : (
          <div className="space-y-3">
            {realtimeAlerts.slice(0, 5).map((alert, index) => (
              <div
                key={`${alert.alertId}-${index}`}
                className="flex flex-col justify-between gap-2 rounded-xl border border-blue-100 bg-white p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-slate-800">
                    {alert.message}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Vehicle: {alert.vehicleId} · {formatDate(alert.occurredAt)}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    severityStyles[alert.severity]
                  }`}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={vehicleIdInput}
            onChange={(event) => setVehicleIdInput(event.target.value)}
            placeholder="Search by Vehicle ID..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-400"
          />
        </div>

        <select
          value={
            filters.resolved === undefined
              ? "all"
              : filters.resolved
                ? "resolved"
                : "active"
          }
          onChange={(event) => {
            const value = event.target.value;

            onUpdateFilters({
              resolved: value === "all" ? null : value === "resolved",
            });
          }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </select>

        <select
          value={filters.severity ?? "all"}
          onChange={(event) => {
            const value = event.target.value;

            onUpdateFilters({
              severity: value === "all" ? null : (value as AlertSeverity),
            });
          }}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400">
          <option value="all">All Severity</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {actionError}
        </div>
      )}

      {/* Alert List */}
      {loading && alerts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <AlertTriangle size={36} className="mx-auto mb-3 text-slate-300" />
          <h3 className="font-semibold text-slate-700">No alerts found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <article
              key={alert._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-red-50 p-3 text-red-600">
                    <AlertTriangle size={21} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800">
                      {alert.message}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Vehicle ID:{" "}
                      {typeof alert.vehicleId === "string"
                        ? alert.vehicleId
                        : alert.vehicleId.vehicleId}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      severityStyles[alert.severity]
                    }`}>
                    {alert.severity}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      alert.resolved
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                    {alert.resolved ? "Resolved" : "Active"}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 text-sm text-slate-500 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Bell size={16} />
                  <span className="capitalize">
                    {alert.type.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>
                    {alert.location.latitude.toFixed(4)},{" "}
                    {alert.location.longitude.toFixed(4)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{formatDate(alert.occurredAt)}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                <span className="text-xs capitalize text-slate-400">
                  Transition: {alert.transition}
                </span>

                {!alert.resolved ? (
                  <button
                    onClick={() => handleResolve(alert._id)}
                    disabled={resolvingId === alert._id}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50">
                    <CheckCircle size={16} />
                    {resolvingId === alert._id
                      ? "Resolving..."
                      : "Resolve Alert"}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-emerald-600">
                    Alert resolved
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <p className="text-sm text-slate-500">
          Total alerts: {total} · Page {page} of {totalPages}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onPreviousPage}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
            Previous
          </button>

          <button
            onClick={onNextPage}
            disabled={page >= totalPages || loading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
