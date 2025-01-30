import { Box, Button, Input, Stack, Text, VStack } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import SearchSelect from "@/components/ui/SearchSelect";
import { debounce } from "lodash";
import { toaster } from "@/components/ui/toaster";
import { Waypoint } from "@/utils/models";

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
    }, 500),
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

  const calculateRoute = async () => {
    if (!selectedLocation) return;
    setIsCalculating(true);
    const [lat, lon] = selectedLocation;

    // Generate points in a circle around the selected location
    const radius = walkingDuration * 0.02; // Rough estimate: 0.02 degrees per minute of walking
    const points = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI * 2) / 4;
      const newLat = lat + radius * Math.cos(angle);
      const newLon = lon + radius * Math.sin(angle);
      points.push(`${newLon},${newLat}`);
    }

    try {
      const response = await fetch(
        `http://router.project-osrm.org/trip/v1/foot/${lon},${lat};${points.join(";")}?roundtrip=true&source=first&destination=last&geometries=geojson`,
      );
      const data = await response.json();

      if (data.trips && data.trips[0].geometry.coordinates) {
        const coordinates = data.trips[0].geometry.coordinates.map(
          ([lon, lat]: number[]) => ({ lat, lon }),
        );
        setRoutePoints(coordinates);

        const newMarkers = data.waypoints.map((waypoint: Waypoint) => ({
          id: Date.now() + Math.random(),
          position: [waypoint.location[1], waypoint.location[0]] as [
            number,
            number,
          ],
        }));

        setMarkers(newMarkers);

        toaster.create({
          title: "Route calculated",
          description: "Your walking route has been generated successfully",
          duration: 3000,
        });
      }
    } catch (error) {
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
