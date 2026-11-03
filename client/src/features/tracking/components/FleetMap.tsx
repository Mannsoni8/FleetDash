import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import type { TrackingVehicle } from "../types/tracking";
import VehicleMarker from "./VehicleMarker";

interface FleetMapProps {
  vehicles: TrackingVehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
}

const FleetMap = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
}: FleetMapProps) => {
  const validVehicles = vehicles.filter(({ currentLocation }) => {
    const { latitude, longitude } = currentLocation;

    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  });

  const defaultCenter: [number, number] = [22.3072, 73.1812];

  return (
    <div className="h-[550px] w-full overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validVehicles.map((vehicle) => (
          <VehicleMarker
            key={vehicle.vehicleId}
            vehicle={vehicle}
            selected={selectedVehicleId === vehicle.vehicleId}
            onSelect={onSelectVehicle}
          />
        ))}
      </MapContainer>

      <div className="sr-only">
        Showing {validVehicles.length} vehicles on the map.
      </div>
    </div>
  );
};

export default FleetMap;