import styles from "@/styles/imageFormatting.module.css";
import { useState, useRef, useEffect, useContext } from "react";
import { ImageStorageContext } from "@/components/context/imageContext";
import { useRouter } from "next/router";
import ErasingCanvas from "@/components/ErasingCanvas";

const WalkableAreaExtraction = () => {
  const [selectedCanvas, setSelectedCanvas] = useState(0);
  const { extractedWalkways, polishedWalkeways, setPolishedWalkways } =
    useContext(ImageStorageContext);
  const router = useRouter();

  useEffect(() => {
    if (extractedWalkways.length == 0) {
      router.push("/imageFormating");
    }
  }, [extractedWalkways]);

  const handleLogElements = async () => {
    console.log(polishedWalkeways);
    router.push("/regionLabelling");
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
              <ErasingCanvas
                backgroundImage={file}
                // Pass a callback to update drawn regions in the parent.
                savePolished={(canvas) => {
                  setPolishedWalkways((prev) => ({ ...prev, [index]: canvas }));
                }}
              />
            </div>
          ))}
      </div>
      <div className={styles.toolbar}>
        {extractedWalkways &&
          extractedWalkways.map((file, index) => (
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
                    file.startsWith("`data:image/")
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
    </div>
  );
};

export default WalkableAreaExtraction;
