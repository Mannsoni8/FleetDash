import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./features/dashboard/components/DashboardPage";
import { useRealtime } from "./hooks/useRealtime";

const App = () => {
  const { isConnected, telemetry, alerts } = useRealtime();

  return (
    <DashboardLayout isConnected={isConnected}>
      <DashboardPage
        telemetry={telemetry}
        alerts={alerts}
      />
    </DashboardLayout>
  );
};

export default App;
