import React, { useRef, useState, useEffect } from "react";

const RegionDrawingCanvas = ({ backgroundImage, onShapesChange }) => {
  const canvasRef = useRef(null);
  // Points for the region being drawn
  const [points, setPoints] = useState([]);
  // Array of finalized regions (each is an array of points)
  const [shapes, setShapes] = useState([]);
  // Background image as a loaded HTMLImageElement
  const [bgImg, setBgImg] = useState(null);
  // Tolerance (in pixels) for snapping to the first point
  const tolerance = 10;

  // When backgroundImage prop changes, load it as an Image object.
  useEffect(() => {
    if (!backgroundImage) {
      setBgImg(null);
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      setBgImg(img);
      // Optionally, adjust the canvas size to match the background.
      // For example, you could set canvas dimensions here.
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }
      drawCanvas(points, shapes, img);
    };
    img.src = `data:image/jpeg;base64,${backgroundImage}`;
  }, [backgroundImage]);

  // Draw the canvas: clear, then draw the background image (if loaded)
  // and then the finalized regions and current points.
  const drawCanvas = (pts = points, shps = shapes, bg = bgImg) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background image if available.
    if (bg) {
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    }

    // Draw finalized shapes in blue
    shps.forEach((shape) => {
      ctx.beginPath();
      shape.forEach((pt, i) => {
        if (i === 0) {
          ctx.moveTo(pt.x, pt.y);
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      });
      ctx.closePath();
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw current region in red
    if (pts.length > 0) {
      ctx.beginPath();
      pts.forEach((pt, i) => {
        if (i === 0) {
          ctx.moveTo(pt.x, pt.y);
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      });
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw small circles at each point for visual feedback
      pts.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      });
    }
  };

  // Update the canvas whenever points, shapes, or the background changes.
  useEffect(() => {
    drawCanvas();
  }, [points, shapes, bgImg]);

  // When clicking on the canvas, add a point or finalize the region.
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const newPoint = {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };

    // If there are already points, check if the click is near the first point.
    if (points.length > 0) {
      const firstPoint = points[0];
      const dx = newPoint.x - firstPoint.x;
      const dy = newPoint.y - firstPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // If within tolerance and at least 3 points exist, finalize the region.
      if (distance < tolerance && points.length >= 3) {
        const newShapes = [...shapes, points];
        setShapes(newShapes);
        onShapesChange(newShapes);
        setPoints([]); // Reset for a new region.
        return;
      }
    }
    // Otherwise, add the new point.
    setPoints((prevPoints) => [...prevPoints, newPoint]);
  };

  // Change the cursor when hovering near the first point of the current region.
  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (points.length > 0) {
      const firstPoint = points[0];
      const dx = mx - firstPoint.x;
      const dy = my - firstPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < tolerance) {
        canvas.style.cursor = "pointer";
        return;
      }
    }
    canvas.style.cursor = "default";
  };

  // Remove the last point when Escape is pressed.
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setPoints((prevPoints) => prevPoints.slice(0, -1));
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleCanvasMouseMove);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousemove", handleCanvasMouseMove);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [points]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ border: "1px solid black" }}
        // The canvas width and height can be set by background dimensions or remain fixed.
        width={bgImg ? bgImg.naturalWidth : 800}
        height={bgImg ? bgImg.naturalHeight : 600}
      />
    </div>
  );
};

export default RegionDrawingCanvas;
