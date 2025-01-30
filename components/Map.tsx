import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { renderToString } from "react-dom/server";
import { MdLocationOn } from "react-icons/md";
import L, { LeafletMouseEvent } from "leaflet";
import { useState } from "react";
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

function MapEvents({ onClick }: { onClick: (e: LeafletMouseEvent) => void }) {
  useMapEvents({
    click: onClick,
  });
  return null;
}

const Map = () => {
  const [markers, setMarkers] = useState<MarkerType[]>([]);

  const handleMapClick = (e: LeafletMouseEvent) => {
    const newMarker: MarkerType = {
      id: Date.now(),
      position: [e.latlng.lat, e.latlng.lng],
    };
    setMarkers([...markers, newMarker]);
  };

  return (
    <MapContainer
      center={[52.237049, 21.017532]}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <MapEvents onClick={handleMapClick} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {markers.map((marker) => (
        <Marker key={marker.id} position={marker.position}>
          <Popup>Walking point {marker.id}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
