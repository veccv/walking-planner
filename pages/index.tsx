import { Box, Button, Stack, VStack } from "@chakra-ui/react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import SearchSelect from "@/components/ui/SearchSelect";
import { debounce } from "lodash";

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

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length > 2) {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}`,
        );
        const data: LocationSuggestion[] = await response.json();
        setSuggestions(data);
      }
    }, 1000),
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
  };

  return (
    <Stack direction="row" h="100%" w="100%">
      <Box w="70%">
        <MapWithNoSSR
          defaultLocation={selectedLocation || undefined}
          markers={markers}
          setMarkers={setMarkers}
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
        <Button>Calculate Walking Route</Button>
        <Button onClick={() => setMarkers([])}>Clear Points</Button>
      </VStack>
    </Stack>
  );
};

export default Home;
