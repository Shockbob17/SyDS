import styles from "@/styles/imageFormatting.module.css";
import { useState, useEffect, useContext } from "react";
import { ImageStorageContext } from "@/components/context/imageContext";
import { useRouter } from "next/router";
import LabelledRegionsCanvas from "@/components/SelectingCanvas";
import axios from "axios";

const RegionLabelling = () => {
  const [selectedCanvas, setSelectedCanvas] = useState(0);
  const { drawnRegions, labelColor, extractedWalkways, polishedWalkeways } =
    useContext(ImageStorageContext);
  const router = useRouter();
  // Stores region labels per canvas. For example: { 0: { 0: 1, 1: 2 }, 1: { ... } }
  const [shapeLabels, setShapeLabels] = useState({});

  const actions = ["Cross", "Tenant", "Toilet", "Staircase"];
  const [selectedLabel, setSelectedLabel] = useState(0);

  useEffect(() => {
    if (extractedWalkways.length === 0) {
      router.push("/imageFormating");
    }
  }, [extractedWalkways, router]);

  const handleShapeLabelChange = (regionIndex, label) => {
    setShapeLabels((prev) => ({
      ...prev,
      [selectedCanvas]: {
        ...(prev[selectedCanvas] || {}),
        [regionIndex]: label,
      },
    }));
  };

  const processData = async () => {
    console.log(shapeLabels);
    // await uploadData();
    saveData();
  };

  const saveData = () => {
    // Determine which walkways to use:
    const walkwaysToSend =
      polishedWalkeways && polishedWalkeways.length > 0
        ? polishedWalkeways
        : extractedWalkways;

    console.log("Walkways to send:", walkwaysToSend); // Debugging output

    // Create an object with the data to save
    const dataToSave = {
      walkways: walkwaysToSend,
      drawnRegions: drawnRegions,
      shapeLabels: shapeLabels,
    };

    // Convert the data to a JSON string (with formatting for readability)
    const jsonData = JSON.stringify(dataToSave, null, 2);

    // Create a Blob from the JSON data
    const blob = new Blob([jsonData], { type: "application/json" });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json"; // Set the file name for the download
    document.body.appendChild(a);
    a.click();

    // Clean up: remove the temporary link and revoke the Blob URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const uploadData = async () => {
    try {
      const formData = new FormData();

      // Choose which walkways to send:
      // If polishedWalkeways is not empty, use its values (assuming it holds base64 strings);
      // Otherwise, use extractedWalkways.
      const walkwaysToSend =
        polishedWalkeways && Object.keys(polishedWalkeways).length > 0
          ? Object.values(polishedWalkeways)
          : extractedWalkways;

      walkwaysToSend.forEach((base64String, index) => {
        const imageFile = base64ToFile(base64String, `image_${index}.png`);
        formData.append("images", imageFile);
      });

      formData.append("drawnRegions", JSON.stringify(drawnRegions));
      formData.append("shapeLabels", JSON.stringify(shapeLabels));

      const response = await axios.post(
        "http://localhost:8000/createNumpy",
        formData
      );

      console.log(response.data);
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
        {extractedWalkways &&
          extractedWalkways.map((file, index) => (
            <div
              key={index}
              style={{ display: selectedCanvas === index ? "block" : "none" }}
            >
              <LabelledRegionsCanvas
                backgroundImage={polishedWalkeways[index] || file}
                shapes={drawnRegions[index] || []}
                onShapeLabelChange={handleShapeLabelChange}
                label={selectedLabel}
                // Pass the labels for the current canvas.
                shapeLabels={shapeLabels[selectedCanvas] || {}}
              />
            </div>
          ))}
      </div>
      <div className={styles.toolbar}>
        {actions.map((item, index) => (
          <div key={index} className={styles.centerer}>
            <div
              className={`${styles.iconContainers} ${
                selectedLabel === index ? styles.selected : ""
              }`}
              onClick={() => setSelectedLabel(index)}
            >
              <div
                className={styles.colorContainer}
                style={{ backgroundColor: labelColor[index]["fill"] }}
              />
            </div>
            <div
              className={`${styles.littleLabels}`}
              onClick={() => setSelectedLabel(index)}
            >
              <div className={`${styles[item]}`} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.toolbar}>
        {extractedWalkways &&
          extractedWalkways.map((file, index) => (
            <div
              key={index}
              className={styles.icons}
              onClick={() => setSelectedCanvas(index)}
            >
              <img
                src={`data:image/png;base64,${file}`}
                alt={`Final Processed Image ${index}`}
                style={{ maxWidth: "100%" }}
              />
            </div>
          ))}
      </div>
      <button onClick={() => processData()}>Log Region Labels</button>
    </div>
  );
};

export default RegionLabelling;
