import styles from "@/styles/imageFormatting.module.css";
import { useState, useRef, useContext, useEffect } from "react";
import { ImageStorageContext } from "@/components/context/imageContext";
import { useRouter } from "next/router";
import DraggableCanvas from "@/components/DraggableCanvas";
import axios from "axios";

const ImageProcessing = () => {
  const { rawImages, extractedMaps, elements, setPaddedImages } =
    useContext(ImageStorageContext);
  const router = useRouter();
  const imageDisplayerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (extractedMaps.length == 0) {
      router.push("/imageFormating");
    }
  }, [extractedMaps]);

  const handleLogElements = async () => {
    elements.forEach((el, index) => {
      console.log(
        `Element ${index}: Position (x: ${el.x}, y: ${el.y}), Dimensions (width: ${el.width}, height: ${el.height}), Opacity: ${el.opacity}`
      );
    });
    await uploadImageDimensions();
    router.push("/regionFinding");
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

      const response = await axios.post(
        "http://localhost:8000/resizingImages",
        formData
      );
      console.log(response.data);
      setPaddedImages(response.data.results);
    } catch (error) {
      console.error(
        "Error sending images to backend:",
        error.response?.data || error.message
      );
    }
  };
  return (
    <div className={styles.centerer}>
      <div ref={imageDisplayerRef}></div>
      <DraggableCanvas base64Images={extractedMaps} />
      <button onClick={handleLogElements} style={{ marginTop: "10px" }}>
        Log Elements
      </button>
    </div>
  );
};

export default ImageProcessing;
