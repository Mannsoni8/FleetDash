import { useRealtime } from "./hooks/useRealtime";
import {
  Activity,
  AlertTriangle,
  Bell,
  LayoutDashboard,
  MapPin,
  Menu,
  Truck,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useState } from "react";

function App() {
  const { isConnected, telemetry, alerts } = useRealtime();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const uniqueVehicles = new Set(telemetry.map((item) => item.vehicleId));

  const stats = [
    {
      label: "Live Vehicles",
      value: uniqueVehicles.size,
      icon: Truck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Telemetry Events",
      value: telemetry.length,
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Alerts",
      value: alerts.length,
      icon: AlertTriangle,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2 text-white">
              <Truck size={23} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FleetDash</h1>
              <p className="text-xs text-slate-400">Fleet Management</p>
            </div>
          </div>

          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <p className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <a
            href="#overview"
            className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 font-medium text-blue-700"
          >
            <LayoutDashboard size={19} />
            Overview
          </a>

          <a
            href="#vehicles"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
          >
            <Truck size={19} />
            Live Vehicles
          </a>

          <a
            href="#alerts"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
          >
            <Bell size={19} />
            Alerts
            {alerts.length > 0 && (
              <span className="ml-auto rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                {alerts.length}
              </span>
            )}
          </a>

          <a
            href="#tracking"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-100"
          >
            <MapPin size={19} />
            Tracking
          </a>
        </nav>

        <div className="border-t border-slate-100 p-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold">FleetDash Backend</p>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              <span className="text-slate-500">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div>
              <h2 className="text-lg font-bold sm:text-xl">Dashboard</h2>
              <p className="hidden text-xs text-slate-400 sm:block">
                Real-time fleet monitoring
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
              isConnected
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {isConnected ? <Wifi size={15} /> : <WifiOff size={15} />}
            {isConnected ? "Live Connected" : "Offline"}
          </div>
        </header>

        <div className="space-y-8 p-5 sm:p-8">
          <section id="overview">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                Fleet Overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Monitor your fleet activity and incoming events.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-500">
                        {stat.label}
                      </p>
                      <div className={`rounded-xl p-3 ${stat.bg} ${stat.color}`}>
                        <Icon size={21} />
                      </div>
                    </div>
                    <h3 className="mt-5 text-3xl font-bold">{stat.value}</h3>
                    <p className="mt-2 text-xs text-slate-400">
                      Received during this session
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section id="vehicles" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="font-bold">Live Vehicle Telemetry</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Latest incoming vehicle updates
                </p>
              </div>
              <Activity className="text-blue-600" size={21} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Vehicle ID</th>
                    <th className="px-6 py-4">Speed</th>
                    <th className="px-6 py-4">Latitude</th>
                    <th className="px-6 py-4">Longitude</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {telemetry.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No live telemetry received yet.
                      </td>
                    </tr>
                  ) : (
                    telemetry.map((item) => (
                      <tr key={item.eventId} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium">
                          {item.vehicleId}
                        </td>
                        <td className="px-6 py-4">{item.speed} km/h</td>
                        <td className="px-6 py-4">{item.latitude.toFixed(4)}</td>
                        <td className="px-6 py-4">{item.longitude.toFixed(4)}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section id="alerts" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="font-bold">Recent Alerts</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Real-time geofence notifications
                </p>
              </div>
              <Bell className="text-orange-500" size={21} />
            </div>

            <div className="space-y-4 p-6">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  <AlertTriangle className="mx-auto mb-3" size={28} />
                  No alerts received yet.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.alertId}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                        <AlertTriangle size={19} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{alert.message}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Vehicle: {alert.vehicleId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold capitalize text-orange-700">
                        {alert.severity}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(alert.occurredAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <footer className="py-4 text-center text-xs text-slate-400">
            FleetDash · Real-time Fleet Management System
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
