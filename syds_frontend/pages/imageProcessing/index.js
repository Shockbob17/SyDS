import styles from "@/styles/imageFormatting.module.css";
import { useState, useRef, useContext, useEffect } from "react";
import Image from "next/image";
import { ImageStorageContext } from "@/components/context/imageContext";
import { useRouter } from "next/router";

const ImageProcessing = () => {
  const [selectedImage, setSelectedImage] = useState();
  const { extractedMaps, setExtractedMaps } = useContext(ImageStorageContext);
  const router = useRouter();

  useEffect(() => {
    console.log(extractedMaps.lenght);
    if (extractedMaps.length == 0) {
      router.push("/imageFormating");
    }
  }, [extractedMaps]);

  return (
    <div className={styles.centerer}>
      <div className={styles.imageDisplayer}>
        {selectedImage && (
          <>
            <img
              src={`data:image/jpeg;base64,${selectedImage}`}
              alt="measurement"
              style={{
                maxWidth: "600px",
                maxHeight: "600px",
              }}
            />
          </>
        )}
      </div>
      <div className={styles.toolbar}>
        {extractedMaps.map((base64Str, index) => (
          <div
            key={index}
            className={styles.icons}
            onClick={() => {
              setSelectedImage(base64Str);
            }}
          >
            <Image
              src={`data:image/jpeg;base64,${base64Str}`}
              alt={`Extracted image ${index}`}
              fill={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageProcessing;
