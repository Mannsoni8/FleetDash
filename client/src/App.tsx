import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./features/dashboard/components/DashboardPage";
import { useRealtime } from "./hooks/useRealtime";
import { useVehicles } from "./features/vehicles/hooks/useVehicles";
import { useAlerts } from "./features/alerts/hooks/useAlerts";

const App = () => {
  const realtime = useRealtime();
  const vehicleData = useVehicles();
  const alertData = useAlerts();

  return (
    <DashboardLayout isConnected={realtime.isConnected}>
      <DashboardPage
        telemetry={realtime.telemetry}
        realtimeAlerts={realtime.alerts}
        vehicles={vehicleData.vehicles}
        vehicleLoading={vehicleData.loading}
        vehicleError={vehicleData.error}
        historicalAlerts={alertData.alerts}
        totalAlerts={alertData.total}
        alertsLoading={alertData.loading}
        alertsError={alertData.error}
      />
    </DashboardLayout>
  );
};

export default App;
