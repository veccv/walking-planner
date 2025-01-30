import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Provider } from "@/components/ui/default/provider";
import { Toaster } from "@/components/ui/toaster";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <Component {...pageProps} />
      <Toaster />
    </Provider>
  );
}
