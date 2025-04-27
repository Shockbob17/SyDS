import styles from "@/styles/imageFormatting.module.css";
import { useState, useRef, useContext } from "react";
import Image from "next/image";
import axios from "axios";
import { ImageStorageContext } from "@/components/context/imageContext";
import { useRouter } from "next/router";

const FormattingPage = () => {
  const [selectedImage, setSelectedImage] = useState();
  const { rawImages, setRawImages, setExtractedMaps } =
    useContext(ImageStorageContext);
  const router = useRouter();

  const AddIcon = () => {
    const fileInputRef = useRef(null);

    const addImageFunction = () => {
      fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
      const selectedFiles = event.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;
      const fileArray = Array.from(selectedFiles);
      setRawImages((prevImages) => [...prevImages, ...fileArray]);
    };

    return (
      <div
        className={`${styles.iconContainers} ${styles.tooltip}`}
        onClick={addImageFunction}
      >
        <p style={{ textAlign: "center" }}>+</p>
        <span className={styles.tooltiptext}>Click To Add Image</span>
        <input
          type="file"
          multiple={true}
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept="image/*"
        />
      </div>
    );
  };

  const proceedToNextpage = async () => {
    await uploadImagesToBackend();
    router.push("/imageProcessing");
  };

  const uploadImagesToBackend = async () => {
    try {
      const formData = new FormData();
      rawImages.forEach((imageFile) => {
        // "images" is the field name your backend expects
        formData.append("images", imageFile);
      });
      const response = await axios.post(
        "http://localhost:8000/uploadImages",
        formData
      );
      setExtractedMaps(response.data.results);
      // console.log(response.data.results);
    } catch (error) {
      console.error(
        "Error sending images to backend:",
        error.response?.data || error.message
      );
    }
  };

  return (
    <div className={styles.centerer}>
      <div className={styles.imageDisplayer}>
        {selectedImage && (
          <Image
            src={URL.createObjectURL(selectedImage)}
            alt={selectedImage.name}
            fill={true}
          />
        )}
      </div>
      <div className={styles.toolbar}>
        {rawImages.map((file, index) => (
          <>
            <div
              key={index}
              className={styles.icons}
              onClick={() => {
                setSelectedImage(file);
              }}
            >
              <Image
                src={URL.createObjectURL(file)}
                alt={file.name}
                fill={true}
              />
            </div>
          </>
        ))}
        <AddIcon />
      </div>
      <button onClick={() => proceedToNextpage()}>
        Send Images to backend
      </button>
    </div>
  );
};

export default FormattingPage;
