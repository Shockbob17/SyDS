import { createContext, useState } from "react";

export const ImageStorageContext = createContext();

export const ImageStorageProvider = ({ children }) => {
  const [rawImages, setRawImages] = useState([]);
  const [extractedMaps, setExtractedMaps] = useState([]);
  const [elements, setElements] = useState([]);
  const [paddedImages, setPaddedImages] = useState([]);
  const [drawnRegions, setDrawnRegions] = useState({});
  const [extractedWalkways, setExtractedWalkways] = useState([]);
  const [labelColor, setLabelColor] = useState({
    0: { fill: "rgba(20, 22, 22, 0.5)", outline: "rgba(59,80,78,1)" },
    1: { fill: "rgba(15, 51, 33, 0.5)", outline: "rgba(90,160,126,1)" },
    2: { fill: "rgba(23, 167, 211, 0.5)", outline: "rgba(113,169,186,1)" },
    3: { fill: "rgba(240, 226, 226, 0.51)", outline: "rgba(217,217,217,1)" },
  });

  return (
    <ImageStorageContext.Provider
      value={{
        rawImages,
        setRawImages,
        extractedMaps,
        setExtractedMaps,
        elements,
        setElements,
        paddedImages,
        setPaddedImages,
        drawnRegions,
        setDrawnRegions,
        extractedWalkways,
        setExtractedWalkways,
        labelColor,
        setLabelColor,
      }}
    >
      {children}
    </ImageStorageContext.Provider>
  );
};
