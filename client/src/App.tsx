import { Routes, Route } from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./features/dashboard/components/DashboardPage";

import { useRealtime } from "./hooks/useRealtime";
import { useVehicles } from "./features/vehicles/hooks/useVehicles";
import { useAlerts } from "./features/alerts/hooks/useAlerts";
import VehiclesPage from "./features/vehicles/pages/VehiclesPage";

const App = () => {
  const realtime = useRealtime();
  const vehicleData = useVehicles();
  const alertData = useAlerts();

  return (
    <DashboardLayout isConnected={realtime.isConnected}>
      <Routes>
        <Route
          path="/"
          element={
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
          }
        />

        <Route
          path="/vehicles"
          element={
            <VehiclesPage
              vehicles={vehicleData.vehicles}
              telemetry={realtime.telemetry}
              loading={vehicleData.loading}
              error={vehicleData.error}
              onRefresh={vehicleData.refetch}
            />
          }
        />

        <Route path="/alerts" element={<div>Alerts Page — Coming Next</div>} />

        <Route
          path="/tracking"
          element={<div>Tracking Page — Coming Next</div>}
        />
      </Routes>
    </DashboardLayout>
  );
};

export default App;
