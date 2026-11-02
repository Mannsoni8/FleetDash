import { useEffect, useState } from "react";
import { socket } from "../lib/socket";
import type { TelemetryUpdate, AlertCreated } from "../types/realtime.ts";

export const useRealtime = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [telemetry, setTelemetry] = useState<TelemetryUpdate[]>([]);
  const [alerts, setAlerts] = useState<AlertCreated[]>([]);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleTelemetry = (data: TelemetryUpdate) => {
      setTelemetry((prev) => [data, ...prev].slice(0, 50));
    };

    const handleAlert = (data: AlertCreated) => {
      setAlerts((prev) => [data, ...prev].slice(0, 50));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("telemetry:update", handleTelemetry);
    socket.on("alert:created", handleAlert);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("telemetry:update", handleTelemetry);
      socket.off("alert:created", handleAlert);
      socket.disconnect();
    };
  }, []);

  return { isConnected, telemetry, alerts };
};