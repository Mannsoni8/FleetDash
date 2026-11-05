import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./features/dashboard/components/DashboardPage";

import { useRealtime } from "./hooks/useRealtime";
import { useVehicles } from "./features/vehicles/hooks/useVehicles";
import { useAlerts } from "./features/alerts/hooks/useAlerts";
import VehiclesPage from "./features/vehicles/pages/VehiclesPage";
import AlertsPage from "./features/alerts/pages/AlertsPage";
import TrackingPage from "./features/tracking/pages/TrackingPage";
import GeofencesPage from "./features/geofences/pages/GeofencesPage";
import LoginPage from "./features/auth/LoginPage";
import { socket } from "./lib/socket";

const App = () => {
  const [authenticated, setAuthenticated] = useState(Boolean(localStorage.getItem("fleetdash.accessToken")));
  if (!authenticated) return <LoginPage onLogin={() => setAuthenticated(true)} />;
  const logout = () => {
    localStorage.removeItem("fleetdash.accessToken");
    socket.disconnect();
    setAuthenticated(false);
  };
  return <AuthenticatedApp onLogout={logout} />;
};

const AuthenticatedApp = ({ onLogout }: { onLogout: () => void }) => {
  const realtime = useRealtime();
  const vehicleData = useVehicles();
  const alertData = useAlerts();

  return (
    <DashboardLayout isConnected={realtime.isConnected} onLogout={onLogout}>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
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

        <Route
          path="/alerts"
          element={
            <AlertsPage
              alerts={alertData.alerts}
              realtimeAlerts={realtime.alerts}
              loading={alertData.loading}
              error={alertData.error}
              page={alertData.page}
              totalPages={alertData.totalPages}
              total={alertData.total}
              onNextPage={alertData.nextPage}
              onPreviousPage={alertData.previousPage}
              onRefresh={alertData.refetch}
              filters={alertData.filters}
              onUpdateFilters={alertData.updateFilters}
            />
          }
        />
        <Route path="/tracking" element={<TrackingPage />} />
        <Route path="/geofences" element={<GeofencesPage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default App;
