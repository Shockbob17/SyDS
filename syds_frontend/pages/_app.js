import "@/styles/styles.css";
import "@/styles/text.css";
import { ImageStorageProvider } from "@/components/context/imageContext";
export default function App({ Component, pageProps }) {
  return (
    <ImageStorageProvider>
      <Component {...pageProps} />
    </ImageStorageProvider>
  );
}
