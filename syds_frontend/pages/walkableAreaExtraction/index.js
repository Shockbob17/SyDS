import styles from "@/styles/imageFormatting.module.css";
import { useState, useRef, useEffect, useContext } from "react";
import Image from "next/image";
import axios from "axios";
import { ImageStorageContext } from "@/components/context/imageContext";
import { useRouter } from "next/router";

const FormattingPage = () => {
  const [selectedCanvas, setSelectedCanvas] = useState(0);
  const { extractedWalkways, drawnRegions, setDrawnRegions } =
    useContext(ImageStorageContext);
  const router = useRouter();

  useEffect(() => {
    if (extractedWalkways.length == 0) {
      router.push("/imageFormating");
    } else {
      setSelectedCanvas(extractedWalkways[0]);
    }
  }, [extractedWalkways]);

  const handleLogElements = async () => {
    // router.push("/regionLabelling");
    console.log(drawnRegions);
    await uploadImageDimensions();
  };

  return (
    <div className={styles.centerer}>
      <div>
        {extractedWalkways &&
          extractedWalkways.map((file, index) => (
            <div
              key={index}
              style={{ display: selectedCanvas === index ? "block" : "none" }}
            ></div>
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

export default FormattingPage;
