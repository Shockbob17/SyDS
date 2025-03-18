import styles from "@/styles/imageFormatting.module.css";
import { useState, useEffect, useContext } from "react";
import { ImageStorageContext } from "@/components/context/imageContext";
import { useRouter } from "next/router";
import LabelledRegionsCanvas from "@/components/SelectingCanvas";

const FormattingPage = () => {
  const [selectedCanvas, setSelectedCanvas] = useState(0);
  const { drawnRegions, labelColor, extractedWalkways } =
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
                backgroundImage={file}
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
                src={`data:image/jpeg;base64,${file}`}
                alt={`Final Processed Image ${index}`}
                style={{ maxWidth: "100%" }}
              />
            </div>
          ))}
      </div>
      <button onClick={() => console.log(shapeLabels)}>
        Log Region Labels
      </button>
    </div>
  );
};

export default FormattingPage;
