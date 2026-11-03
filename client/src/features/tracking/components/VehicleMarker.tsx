import { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { TrackingVehicle } from "../types/tracking";

interface VehicleMarkerProps {
  vehicle: TrackingVehicle;
  selected: boolean;
  onSelect: (vehicleId: string) => void;
}

const VehicleMarker = ({
  vehicle,
  selected,
  onSelect,
}: VehicleMarkerProps) => {
  const icon = useMemo(() => {
    const statusColors = {
      online: "#16a34a",
      offline: "#64748b",
      idle: "#eab308",
      maintenance: "#f97316",
    };

    const color = statusColors[vehicle.status];

    return L.divIcon({
      className: "fleet-vehicle-marker",
      html: `
        <div style="
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          outline: ${selected ? "3px solid #2563eb" : "none"};
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">V</div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  }, [vehicle.status, selected]);

  const { latitude, longitude } = vehicle.currentLocation;

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return (
    <Marker
      position={[latitude, longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(vehicle.vehicleId),
      }}
    >
      <Popup>
        <div className="space-y-1">
          <h3 className="font-semibold">
            {vehicle.registrationNumber}
          </h3>

          <p>Vehicle ID: {vehicle.vehicleId}</p>
          <p>Driver: {vehicle.driverName}</p>
          <p>Speed: {vehicle.currentSpeed} km/h</p>
          <p className="capitalize">Status: {vehicle.status}</p>
        </div>
      </Popup>
    </Marker>
  );
};

export default VehicleMarker;