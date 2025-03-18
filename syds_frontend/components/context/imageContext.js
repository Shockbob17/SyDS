import { createContext, useState } from "react";

export const ImageStorageContext = createContext();

export const ImageStorageProvider = ({ children }) => {
  const [rawImages, setRawImages] = useState([]);
  const [extractedMaps, setExtractedMaps] = useState([]);

  return (
    <ImageStorageContext.Provider
      value={{
        rawImages,
        setRawImages,
        extractedMaps,
        setExtractedMaps,
      }}
    >
      {children}
    </ImageStorageContext.Provider>
  );
};
