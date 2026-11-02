import { Activity } from "lucide-react";
import type { TelemetryUpdate } from "../../../types/realtime";

interface TelemetryTableProps {
  telemetry: TelemetryUpdate[];
}

const TelemetryTable = ({ telemetry }: TelemetryTableProps) => {
  return (
    <section
      id="vehicles"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
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
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-slate-400"
                >
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
                  <td className="px-6 py-4">
                    {item.latitude.toFixed(4)}
                  </td>
                  <td className="px-6 py-4">
                    {item.longitude.toFixed(4)}
                  </td>
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
  );
};

export default TelemetryTable;
