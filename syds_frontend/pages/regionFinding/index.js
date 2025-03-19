import styles from "@/styles/imageFormatting.module.css";
import { useState, useRef, useEffect, useContext } from "react";
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

      // Convert base64 images to File objects
      paddedImages.forEach((base64String, index) => {
        const imageFile = base64ToFile(base64String, `image_${index}.png`);
        formData.append("images", imageFile);
      });

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

  const base64ToFile = (base64String, filename) => {
    // Extract the mime type from the base64 string
    const mimeType = base64String.match(/data:(.*);base64/)[1];
    const byteCharacters = atob(base64String.split(",")[1]); // Decode base64

    // Convert to array buffer
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    return new File([blob], filename, { type: mimeType });
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
                  src={
                    file.startsWith("data:image")
                      ? file
                      : `data:image/jpeg;base64,${file}`
                  }
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
