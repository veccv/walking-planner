import { Box, Input, Text, VStack } from "@chakra-ui/react";

interface LocationSuggestion {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

interface SearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  suggestions: LocationSuggestion[];
}
// Modify the SearchSelect component to show suggestions immediately:
export const SearchSelect = ({
  value,
  onChange,
  onSelect,
  suggestions,
}: SearchSelectProps) => {
  // Remove the isOpen state since we want suggestions to show immediately
  return (
    <Box position="relative" width="100%" className="search-select-container">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search address..."
      />
      {suggestions.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="white"
          borderWidth="1px"
          borderRadius="md"
          maxH="200px"
          overflowY="auto"
          zIndex={1000}
          shadow="md"
        >
          <VStack align="stretch">
            {suggestions.map((suggestion) => (
              <Box
                key={suggestion.place_id}
                p={2}
                width="100%"
                cursor="pointer"
                _hover={{ bg: "gray.100" }}
                onClick={() => onSelect(suggestion)}
              >
                <Text fontSize="sm">{suggestion.display_name}</Text>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default SearchSelect;
