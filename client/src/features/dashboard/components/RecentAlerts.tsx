import { AlertTriangle, Clock } from "lucide-react";
import type { AlertCreated } from "../../../types/realtime";

interface RecentAlertsProps {
  alerts: AlertCreated[];
}

const RecentAlerts = ({ alerts }: RecentAlertsProps) => {
  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-700";
      case "high":
        return "bg-orange-100 text-orange-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  return (
    <section
      id="alerts"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 p-6">
        <div>
          <h3 className="font-bold">Recent Alerts</h3>
          <p className="mt-1 text-xs text-slate-400">
            Latest fleet notifications
          </p>
        </div>
        <AlertTriangle className="text-orange-500" size={21} />
      </div>

      <div className="divide-y divide-slate-100">
        {alerts.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No alerts received yet.
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div
              key={`${alert.alertId}-${index}`}
              className="flex items-start gap-4 p-5 transition hover:bg-slate-50"
            >
              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <AlertTriangle size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">
                    {alert.type}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getSeverityStyle(alert.severity)}`}
                  >
                    {alert.severity}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  {alert.message}
                </p>

                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <Clock size={13} />
                  <span>{new Date(alert.occurredAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>Vehicle: {alert.vehicleId}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default RecentAlerts;
