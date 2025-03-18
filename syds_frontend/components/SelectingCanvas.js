import React, { useRef, useState, useEffect, useContext } from "react";
import { ImageStorageContext } from "@/components/context/imageContext";

// Utility function: Check if a point is inside a polygon (ray-casting algorithm)
const isPointInPolygon = (point, polygon) => {
  let inside = false;
  const { x, y } = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

const LabelledRegionsCanvas = ({
  backgroundImage,
  shapes, // Array of shapes (each shape is an array of points)
  onShapeLabelChange, // Callback: (shapeIndex, label) => void
  label, // Currently selected label from the parent's toolbar
  shapeLabels, // Object mapping shape indices to stored labels
}) => {
  const { labelColor } = useContext(ImageStorageContext);
  const canvasRef = useRef(null);
  // The index of the currently selected shape.
  const [selectedShapeIndex, setSelectedShapeIndex] = useState(null);

  // Draw the canvas background and shapes.
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // Clear the canvas.
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the background image if available.
    if (backgroundImage) {
      const bg = new window.Image();
      bg.onload = () => {
        // Optionally, set the canvas dimensions to match the background image.
        canvas.width = bg.naturalWidth;
        canvas.height = bg.naturalHeight;
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        drawShapes(ctx);
      };
      bg.src = `data:image/jpeg;base64,${backgroundImage}`;
    } else {
      drawShapes(ctx);
    }
  };

  // Draw each shape on top of the background.
  const drawShapes = (ctx) => {
    shapes.forEach((shape, index) => {
      ctx.beginPath();
      shape.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();

      // Determine effective label for this shape:
      // 1. If the parent's mapping (shapeLabels) has an assigned label for this shape, use it.
      // 2. Else if this shape is selected, use the current parent's selected label.
      let effectiveLabel = null;
      if (shapeLabels && shapeLabels[index] !== undefined) {
        effectiveLabel = shapeLabels[index];
      } else if (index === selectedShapeIndex) {
        effectiveLabel = label;
      }

      if (effectiveLabel !== null && labelColor[effectiveLabel]) {
        // Use the colors from labelColor for the effective label.
        ctx.strokeStyle = labelColor[effectiveLabel]["outline"];
        ctx.lineWidth = index === selectedShapeIndex ? 3 : 2;
        ctx.fillStyle = labelColor[effectiveLabel]["fill"];
        ctx.fill();
      } else {
        // Default style if no label is assigned.
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
      }
      ctx.stroke();
    });
  };

  // When the canvas is clicked, determine if a shape was clicked.
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    let found = false;
    shapes.forEach((shape, index) => {
      if (isPointInPolygon(clickPoint, shape)) {
        setSelectedShapeIndex(index);
        // Immediately update parent's mapping with the current label.
        if (onShapeLabelChange) {
          onShapeLabelChange(index, label);
        }
        found = true;
      }
    });
    if (!found) {
      setSelectedShapeIndex(null);
    }
  };

  // Redraw canvas when dependencies change.
  useEffect(() => {
    drawCanvas();
  }, [backgroundImage, shapes, selectedShapeIndex, label, shapeLabels]);

  // Set up canvas click listener.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("click", handleCanvasClick);
    return () => {
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [shapes, label, onShapeLabelChange]);

  return (
    <div>
      <canvas ref={canvasRef} style={{ border: "1px solid black" }} />
    </div>
  );
};

export default LabelledRegionsCanvas;
