import { Truck, Activity, Bell } from "lucide-react";
import StatCard from "../../../components/ui/StatCard";
import TelemetryTable from "./TelemetryTable";
import RecentAlerts from "./RecentAlerts";
import type { TelemetryUpdate, AlertCreated } from "../../../types/realtime";

interface DashboardPageProps {
  telemetry: TelemetryUpdate[];
  alerts: AlertCreated[];
}

const DashboardPage = ({ telemetry, alerts }: DashboardPageProps) => {
  const liveVehicles = new Set(
    telemetry.map((item) => item.vehicleId)
  ).size;

  return (
    <>
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Fleet Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor your fleet activity and live vehicle updates.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Live Vehicles"
          value={liveVehicles}
          icon={Truck}
          color="text-blue-600"
          bgColor="bg-blue-50"
          description="Unique vehicles seen in this session"
        />

        <StatCard
          title="Telemetry Events"
          value={telemetry.length}
          icon={Activity}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          description="Recent events received"
        />

        <StatCard
          title="Total Alerts"
          value={alerts.length}
          icon={Bell}
          color="text-orange-600"
          bgColor="bg-orange-50"
          description="Alerts received in this session"
        />
      </div>

      {/* Telemetry */}
      <TelemetryTable telemetry={telemetry} />

      {/* Alerts */}
      <RecentAlerts alerts={alerts} />
    </>
  );
};

export default DashboardPage;