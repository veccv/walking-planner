import { Button, Stack, VStack } from "@chakra-ui/react";
import dynamic from "next/dynamic";

const MapWithNoSSR = dynamic(() => import("../components/Map"), {
  ssr: false,
});

const Home = () => {
  return (
    <Stack direction="row" h="100%" w="100%">
      <MapWithNoSSR />
      <VStack mt={4} w="20%">
        <Button>Calculate Walking Route</Button>
        <Button>Clear Points</Button>
      </VStack>
    </Stack>
  );
};

export default Home;
