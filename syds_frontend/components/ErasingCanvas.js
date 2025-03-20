import React, { useRef, useState, useEffect } from "react";

const ErasingCanvas = ({ backgroundImage, savePolished }) => {
  const canvasRef = useRef(null);
  const [bgImg, setBgImg] = useState(null);
  const [isErasing, setIsErasing] = useState(false);
  // Eraser radius in pixels.
  const [eraserRadius, setEraserRadius] = useState(20);

  // Load the background image when the prop changes.
  useEffect(() => {
    if (!backgroundImage) return;
    const img = new window.Image();
    img.onload = () => {
      setBgImg(img);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        // Draw the background image.
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    };
    img.src = `data:image/png;base64,${backgroundImage}`;
  }, [backgroundImage]);

  // Eraser function: draws a circle using destination-out composite mode.
  const eraseAt = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const ctx = canvas.getContext("2d");
    // Set composite mode so that drawing makes pixels transparent.
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, eraserRadius, 0, Math.PI * 2, false);
    ctx.fill();
  };

  const handleMouseDown = (e) => {
    setIsErasing(true);
    eraseAt(e);
  };

  const handleMouseMove = (e) => {
    if (!isErasing) return;
    eraseAt(e);
  };

  const handleMouseUp = () => {
    setIsErasing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      // Reset composite operation.
      const ctx = canvas.getContext("2d");
      ctx.globalCompositeOperation = "source-over";
    }
  };

  const handleWheel = (e) => {
    e.preventDefault(); // Prevent page scrolling.
    // Increase radius on scroll down, decrease on scroll up.
    const delta = e.deltaY;
    setEraserRadius((prevRadius) => {
      let newRadius = prevRadius + (delta > 0 ? -1 : 1);
      // Ensure radius is at least 1 pixel.
      return newRadius < 1 ? 1 : newRadius;
    });
  };

  const getCustomCursor = (radius) => {
    const size = radius * 2;
    const offscreen = document.createElement("canvas");
    offscreen.width = size;
    offscreen.height = size;
    const ctx = offscreen.getContext("2d");
    // Clear canvas
    ctx.clearRect(0, 0, size, size);
    // Draw circle
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
    return offscreen.toDataURL();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const cursorDataURL = getCustomCursor(eraserRadius);
      // The hotspot is set at the center of the circle.
      canvas.style.cursor = `url(${cursorDataURL}) ${eraserRadius} ${eraserRadius}, crosshair`;
    }
  }, [eraserRadius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [isErasing]);

  const exportCanvasAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Get the data URL in PNG format.
    const dataURL = canvas.toDataURL("image/png");
    savePolished(dataURL);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid black",
          cursor: isErasing ? "crosshair" : "default",
        }}
      />
      <button onClick={exportCanvasAsImage}>Export Canvas</button>
    </div>
  );
};

export default ErasingCanvas;
