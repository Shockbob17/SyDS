import styles from "@/styles/imageFormatting.module.css";
import { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { ImageStorageContext } from "@/components/context/imageContext";
import { useRouter } from "next/router";
import RegionDrawingCanvas from "@/components/DrawableCanvas";

const RegionFinding = () => {
  const [selectedCanvas, setSelectedCanvas] = useState(0);
  const {
    setPaddedImages,
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

  const LoadJson = () => {
    const fileInputRef = useRef(null);

    const addJson = () => {
      fileInputRef.current.click();
    };

    const handleJsonFile = (event) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      const jsonFile = selectedFiles[0];
      const reader = new FileReader();

      // Triggered when reading is complete
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          // Access specific property from JSON data
          const loadImages = jsonData.paddedImages;
          console.log("paddedImages:", loadImages);
          console.log("actual padded:", paddedImages);
          setPaddedImages(loadImages);
        } catch (err) {
          console.error("Invalid JSON:", err.message);
        }
      };

      // Read the file as text
      reader.readAsText(jsonFile);
    };

    return (
      <div className={`${styles.tooltip}`} onClick={addJson}>
        <p style={{ textAlign: "center" }}>Click to add a json file</p>
        <span className={styles.tooltiptext}>Click To Read a json File</span>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleJsonFile}
          style={{ display: "none" }}
        />
      </div>
    );
  };

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
                      : `data:image/png;base64,${file}`
                  }
                  alt="Final Processed Image"
                  style={{ maxWidth: "100%" }}
                />
              </div>
            </>
          ))}
      </div>
      <button onClick={() => handleLogElements()}>Proceed</button>
      <LoadJson />
    </div>
  );
};

export default RegionFinding;
