import { Box, Button, Input, Stack, Text, VStack } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import SearchSelect from "@/components/ui/SearchSelect";
import { debounce } from "lodash";
import { toaster } from "@/components/ui/toaster";

interface LocationSuggestion {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

interface MarkerType {
  id: number;
  position: [number, number];
}

interface RoutePoint {
  lat: number;
  lon: number;
}

const MapWithNoSSR = dynamic(() => import("../components/Map"), {
  ssr: false,
});

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [walkingDuration, setWalkingDuration] = useState<number>(30);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length > 2) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
        );
        const data: LocationSuggestion[] = await response.json();
        setSuggestions(data);
      }
    }, 200),
    [],
  );

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    const newLocation: [number, number] = [
      parseFloat(suggestion.lat),
      parseFloat(suggestion.lon),
    ];
    setSelectedLocation(newLocation);
    setSuggestions([]);
    setSearchQuery(suggestion.display_name);

    const newMarker: MarkerType = {
      id: Date.now(),
      position: newLocation,
    };
    setMarkers([newMarker]);
    setRoutePoints([]); // Clear previous route when new location is selected
  };

  const metersToDegrees = (meters: number, latitude: number): number => {
    const earthRadius = 6378137;
    return (
      ((meters / earthRadius) * (180 / Math.PI)) /
      Math.cos((latitude * Math.PI) / 180)
    );
  };

  const calculateRoute = async () => {
    if (!selectedLocation) return;
    setIsCalculating(true);
    try {
      const [lat, lon] = selectedLocation;
      const radiusInMeters = walkingDuration * 2;
      const radiusInDegrees = metersToDegrees(radiusInMeters, lat);

      // Generate waypoints in a more strategic way for route API
      const points = [];
      const numberOfPoints = 4; // Using fewer points for better control

      // Add starting point
      points.push(`${lon},${lat}`);

      // Add cardinal points (N, E, S, W) at radius distance
      for (let i = 0; i < numberOfPoints; i++) {
        const angle = (i * 2 * Math.PI) / numberOfPoints;
        const ptLat = lat + radiusInDegrees * Math.cos(angle);
        const ptLon = lon + radiusInDegrees * Math.sin(angle);
        points.push(`${ptLon},${ptLat}`);
      }

      // Add starting point again to close the loop
      points.push(`${lon},${lat}`);

      const response = await fetch(
        `https://router.project-osrm.org/route/v1/foot/${points.join(";")}?overview=full&geometries=geojson&continue_straight=true`,
      );

      const data = await response.json();

      if (data.routes && data.routes[0].geometry) {
        const coordinates = data.routes[0].geometry.coordinates.map(
          ([lon, lat]: number[]) => ({ lat, lon }),
        );

        setRoutePoints(coordinates);

        // Create markers at key points
        const newMarkers: MarkerType[] = [
          {
            id: Date.now(),
            position: selectedLocation,
          },
        ];

        setMarkers(newMarkers);

        toaster.create({
          title: "Route calculated",
          description:
            "Your circular walking route has been generated successfully",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Route calculation error:", error);
      toaster.create({
        title: "Error calculating route",
        description: `Unable to calculate route: ${error}`,
        duration: 3000,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value === "") {
      setWalkingDuration(0);
      return;
    }
    const numValue = parseInt(value);
    if (numValue >= 1 && numValue <= 180) {
      setWalkingDuration(numValue);
    }
  };

  return (
    <Stack direction="row" h="100%" w="100%">
      <Box w="70%">
        <MapWithNoSSR
          defaultLocation={selectedLocation || undefined}
          markers={markers}
          setMarkers={setMarkers}
          routePoints={routePoints}
        />
      </Box>
      <VStack mt={4} w="30%" p={4}>
        <SearchSelect
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            debouncedSearch(value);
          }}
          onSelect={handleLocationSelect}
          suggestions={suggestions}
        />

        <Box w="100%">
          <Text>Walking Duration (minutes)</Text>
          <Input
            value={walkingDuration}
            onChange={handleDurationChange}
            placeholder="Enter duration"
            type="text"
            pattern="[0-9]*"
            maxLength={3}
          />
        </Box>

        <Button
          onClick={calculateRoute}
          disabled={!selectedLocation}
          loading={isCalculating}
          colorScheme="blue"
          width="full"
        >
          Calculate Walking Route
        </Button>
        <Button
          onClick={() => {
            setMarkers([]);
            setRoutePoints([]);
          }}
          width="full"
        >
          Clear Points
        </Button>
      </VStack>
    </Stack>
  );
};

export default Home;
