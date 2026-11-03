import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  useMap,
  Circle as LeafletCircle,
  Polygon as LeafletPolygon,
  Popup,
} from "react-leaflet";
import L from "leaflet";

import type { TrackingVehicle } from "../types/tracking";
import type { Geofence } from "../../geofences/types/geofence";
import VehicleMarker from "./VehicleMarker";

interface FleetMapProps {
  vehicles: TrackingVehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicleId: string) => void;
  geofences?: Geofence[];
}

interface MapControllerProps {
  vehicles: TrackingVehicle[];
  selectedVehicle: TrackingVehicle | null;
}

const MapController = ({ vehicles, selectedVehicle }: MapControllerProps) => {
  const map = useMap();

  useEffect(() => {
    if (selectedVehicle) {
      const { latitude, longitude } = selectedVehicle.currentLocation;

      map.flyTo([latitude, longitude], 15, {
        duration: 1,
      });

      return;
    }

    if (vehicles.length === 0) return;

    const bounds = L.latLngBounds(
      vehicles.map(
        (vehicle) =>
          [
            vehicle.currentLocation.latitude,
            vehicle.currentLocation.longitude,
          ] as [number, number],
      ),
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 14,
      });
    }
  }, [map, vehicles, selectedVehicle]);

  return null;
};

const FleetMap = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  geofences = [],
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

  const selectedVehicle =
    validVehicles.find((vehicle) => vehicle.vehicleId === selectedVehicleId) ??
    null;

  return (
    <div className="h-[550px] w-full overflow-hidden rounded-2xl border border-slate-200">
      <MapContainer
        center={[22.3072, 73.1812]}
        zoom={12}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full">
        <ZoomControl position="bottomright" />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          vehicles={validVehicles}
          selectedVehicle={selectedVehicle}
        />

        {/* Geofence overlays */}
        {geofences
          .filter((geofence) => geofence.isActive)
          .map((geofence) => {
            if (geofence.geometry.type === "Circle") {
              const [longitude, latitude] = geofence.geometry.coordinates;

              if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude) ||
                !geofence.radius ||
                geofence.radius <= 0
              ) {
                return null;
              }

              return (
                <LeafletCircle
                  key={geofence._id}
                  center={[latitude, longitude]}
                  radius={geofence.radius}
                  pathOptions={{
                    color: "#2563eb",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.15,
                    weight: 2,
                  }}>
                  <Popup>
                    <strong>{geofence.name}</strong>
                    <br />
                    Circle geofence
                    <br />
                    Radius: {geofence.radius} m
                  </Popup>
                </LeafletCircle>
              );
            }

            const polygonPositions = geofence.geometry.coordinates.map((ring) =>
              ring.map(
                ([longitude, latitude]) =>
                  [latitude, longitude] as [number, number],
              ),
            );

            return (
              <LeafletPolygon
                key={geofence._id}
                positions={polygonPositions}
                pathOptions={{
                  color: "#7c3aed",
                  fillColor: "#8b5cf6",
                  fillOpacity: 0.15,
                  weight: 2,
                }}>
                <Popup>
                  <strong>{geofence.name}</strong>
                  <br />
                  Polygon geofence
                </Popup>
              </LeafletPolygon>
            );
          })}

        {/* Vehicle markers */}
        {validVehicles.map((vehicle) => (
          <VehicleMarker
            key={vehicle.vehicleId}
            vehicle={vehicle}
            selected={selectedVehicleId === vehicle.vehicleId}
            onSelect={onSelectVehicle}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default FleetMap;
