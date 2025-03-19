import styles from "@/styles/imageFormatting.module.css";
import { useState, useRef, useEffect, useContext } from "react";
import Image from "next/image";
import axios from "axios";
import { ImageStorageContext } from "@/components/context/imageContext";
import { useRouter } from "next/router";
import RegionDrawingCanvas from "@/components/DrawableCanvas";

const RegionFinding = () => {
  const [selectedCanvas, setSelectedCanvas] = useState(0);
  const {
    rawImages,
    elements,
    paddedImages,
    drawnRegions,
    setDrawnRegions,
    setExtractedWalkways,
  } = useContext(ImageStorageContext);
  const router = useRouter();

  useEffect(() => {
    if (paddedImages.length == 0) {
      router.push("/imageFormating");
    }
  }, [paddedImages]);

  const handleLogElements = async () => {
    console.log(drawnRegions);
    await uploadImageDimensions();
    router.push("/walkableAreaExtraction");
  };

  const uploadImageDimensions = async () => {
    try {
      const formData = new FormData();
      rawImages.forEach((imageFile) => {
        formData.append("images", imageFile);
      });

      const dataPoints = elements.map((el, index) => ({
        index,
        x: el.x,
        y: el.y,
        width: el.width,
        height: el.height,
        opacity: el.opacity,
      }));

      // Append the JSON stringified metadata to the formData
      formData.append("dataPoints", JSON.stringify(dataPoints));

      formData.append("drawnRegions", JSON.stringify(drawnRegions));

      const response = await axios.post(
        "http://localhost:8000/extractingWalkway",
        formData
      );
      console.log(response.data);
      setExtractedWalkways(response.data.results);
    } catch (error) {
      console.error(
        "Error sending images to backend:",
        error.response?.data || error.message
      );
    }
  };

  return (
    <div className={styles.centerer}>
      <div>
        {paddedImages &&
          paddedImages.map((file, index) => (
            <div
              key={index}
              style={{ display: selectedCanvas === index ? "block" : "none" }}
            >
              <RegionDrawingCanvas
                backgroundImage={file}
                // Pass a callback to update drawn regions in the parent.
                onShapesChange={(shapes) => {
                  setDrawnRegions((prev) => ({ ...prev, [index]: shapes }));
                }}
              />
            </div>
          ))}
      </div>
      <div className={styles.toolbar}>
        {paddedImages &&
          paddedImages.map((file, index) => (
            <>
              <div
                className={styles.icons}
                onClick={() => {
                  setSelectedCanvas(index);
                }}
              >
                <img
                  key={index}
                  src={`data:image/jpeg;base64,${file}`}
                  alt="Final Processed Image"
                  style={{ maxWidth: "100%" }}
                />
              </div>
            </>
          ))}
      </div>
      <button onClick={() => handleLogElements()}>Proceed</button>
    </div>
  );
};

export default RegionFinding;
