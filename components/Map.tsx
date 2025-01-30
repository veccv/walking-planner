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

function MapEvents({ onClick }: { onClick: (e: LeafletMouseEvent) => void }) {
  useMapEvents({
    click: onClick,
  });
  return null;
}

function MapCenterController({
  center,
  defaultLocation,
}: {
  center: [number, number];
  defaultLocation?: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    // Only set view if there's a defaultLocation
    if (defaultLocation) {
      map.setView(center, 25);
    }
  }, [center, map, defaultLocation]);

  return null;
}

interface MapProps {
  defaultLocation?: [number, number];
  markers: MarkerType[];
  setMarkers: (markers: MarkerType[]) => void;
}

function MapContent({ defaultLocation, markers, setMarkers }: MapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const map = useMap();

  const handleMapClick = (e: LeafletMouseEvent) => {
    const newMarker: MarkerType = {
      id: Date.now(),
      position: [e.latlng.lat, e.latlng.lng],
    };
    setMarkers([...markers, newMarker]);
    setUserLocation(null);
  };

  useEffect(() => {
    if (!defaultLocation && markers.length === 0) {
      if ("geolocation" in navigator) {
        const options = {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        };

        navigator.geolocation.getCurrentPosition(
          (location) => {
            const { latitude, longitude } = location.coords;
            const newLocation: [number, number] = [latitude, longitude];
            setUserLocation(newLocation);

            map.setView(newLocation, 16, {
              animate: false,
            });

            const newMarker: MarkerType = {
              id: Date.now(),
              position: newLocation,
            };
            setMarkers([newMarker]);
          },
          (error) => {
            console.log("Geolocation error:", error);
            const defaultPos: [number, number] = [52.237049, 21.017532];
            map.setView(defaultPos, 13);
          },
          options,
        );
      }
    }
  }, [defaultLocation, markers, setMarkers, map]);

  return (
    <>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {userLocation && (
        <Marker position={userLocation} icon={customIcon}>
          <Popup>Your location</Popup>
        </Marker>
      )}
      {markers.map((marker) => (
        <Marker key={marker.id} position={marker.position} icon={customIcon}>
          <Popup>Walking point {marker.id}</Popup>
        </Marker>
      ))}
      <MapEvents onClick={handleMapClick} />
    </>
  );
}

const Map = (props: MapProps) => {
  const defaultCenter: [number, number] = props.defaultLocation || [
    52.237049, 21.017532,
  ];

  return (
    <MapContainer
      key={
        props.defaultLocation
          ? `${props.defaultLocation[0]}-${props.defaultLocation[1]}`
          : "default"
      }
      center={defaultCenter}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <MapContent {...props} />
      <MapCenterController
        center={defaultCenter}
        defaultLocation={props.defaultLocation} // Pass the prop here
      />
    </MapContainer>
  );
};

export default Map;
