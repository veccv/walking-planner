import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { renderToString } from "react-dom/server";
import { MdLocationOn } from "react-icons/md";
import L, { LeafletMouseEvent } from "leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

interface MarkerType {
  id: number;
  position: [number, number];
}

const customIcon = L.divIcon({
  className: "custom-marker",
  html: renderToString(
    <MdLocationOn style={{ color: "#E53E3E", fontSize: "32px" }} />,
  ),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function LocationMarker() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const map = useMap();

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((location) => {
        const { latitude, longitude } = location.coords;
        setPosition([latitude, longitude]);
        map.flyTo([latitude, longitude], 13);
      });
    }
  }, [map]);

  return position ? (
    <Marker position={position} icon={customIcon}>
      <Popup>Your localization</Popup>
    </Marker>
  ) : null;
}

function MapEvents({ onClick }: { onClick: (e: LeafletMouseEvent) => void }) {
  useMapEvents({
    click: onClick,
  });
  return null;
}

interface MapProps {
  defaultLocation?: [number, number];
}

const Map = ({ defaultLocation }: MapProps) => {
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const defaultCenter: [number, number] = defaultLocation || [
    52.237049, 21.017532,
  ];

  const handleMapClick = (e: LeafletMouseEvent) => {
    const newMarker: MarkerType = {
      id: Date.now(),
      position: [e.latlng.lat, e.latlng.lng],
    };
    setMarkers([...markers, newMarker]);
  };

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <LocationMarker />
      <MapEvents onClick={handleMapClick} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers.map((marker) => (
        <Marker key={marker.id} position={marker.position} icon={customIcon}>
          <Popup>Walking point {marker.id}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
export default Map;
