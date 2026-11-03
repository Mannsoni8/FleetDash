import { Truck, Activity, Bell } from "lucide-react";
import StatCard from "../../../components/ui/StatCard";
import TelemetryTable from "./TelemetryTable";
import RecentAlerts from "./RecentAlerts";
import type { TelemetryUpdate, AlertCreated } from "../../../types/realtime";
import type { Vehicle } from "../../vehicles/types/vehicle";
import type { Alert } from "../../alerts/types/alert";

interface DashboardPageProps {
  telemetry: TelemetryUpdate[];
  realtimeAlerts: AlertCreated[];
  vehicles: Vehicle[];
  vehicleLoading: boolean;
  vehicleError: string | null;
  historicalAlerts: Alert[];
  totalAlerts: number;
  alertsLoading: boolean;
  alertsError: string | null;
}

const DashboardPage = ({
  telemetry,
  realtimeAlerts,
  vehicles,
  vehicleLoading,
  vehicleError,
  historicalAlerts,
  totalAlerts,
  alertsLoading,
  alertsError,
}: DashboardPageProps) => {
  // Convert historical alerts into the format used by RecentAlerts.
  const historicalFormatted = historicalAlerts.map((alert) => ({
    alertId: alert._id,
    vehicleId: alert.vehicleId,
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    occurredAt: alert.occurredAt,
  }));

  // Merge historical and realtime alerts without duplicates.
  const alertMap = new Map(
    historicalFormatted.map((alert) => [alert.alertId, alert]),
  );

  realtimeAlerts.forEach((alert) => {
    if (!alertMap.has(alert.alertId)) {
      alertMap.set(alert.alertId, alert);
    }
  });

  const combinedAlerts = Array.from(alertMap.values()).sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  const normalizedAlerts = combinedAlerts.map((alert) => ({
    ...alert,
    vehicleId:
      typeof alert.vehicleId === "string"
        ? alert.vehicleId
        : alert.vehicleId.vehicleId,
  }));

  const onlineVehicles = vehicles.filter(
    (vehicle) => vehicle.status === "online",
  ).length;

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Fleet Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor your fleet activity and live vehicle updates.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Online Vehicles"
          value={onlineVehicles}
          icon={Truck}
          color="text-blue-600"
          bgColor="bg-blue-50"
          description={
            vehicleLoading
              ? "Loading vehicles..."
              : `${vehicles.length} registered vehicles`
          }
        />

        <StatCard
          title="Telemetry Events"
          value={telemetry.length}
          icon={Activity}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          description="Events received in this session"
        />

        <StatCard
          title="Total Alerts"
          value={totalAlerts}
          icon={Bell}
          color="text-orange-600"
          bgColor="bg-orange-50"
          description="Alerts stored in database"
        />
      </div>

      {vehicleError && <p className="text-sm text-red-600">{vehicleError}</p>}

      <TelemetryTable telemetry={telemetry} />

      <section>
        {alertsError && (
          <p className="mb-3 text-sm text-red-600">{alertsError}</p>
        )}

        {alertsLoading && (
          <p className="mb-3 text-sm text-slate-500">
            Loading historical alerts...
          </p>
        )}

        <RecentAlerts alerts={normalizedAlerts} />
      </section>
    </>
  );
};

export default DashboardPage;
