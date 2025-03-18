import { useRef, useState, useEffect, useContext } from "react";
import { ImageStorageContext } from "@/components/context/imageContext";

const DraggableCanvas = ({ base64Images }) => {
  const canvasRef = useRef(null);

  // Array of element objects, each representing an image on the canvas
  const { elements, setElements } = useContext(ImageStorageContext);

  // State to track user interactions
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 600,
    height: 379,
  });
  const [selectedElementIndex, setSelectedElementIndex] = useState(null);
  const [selectedHandle, setSelectedHandle] = useState(null); // e.g., 'tl', 'tr', 'bl', 'br'

  // On mount, convert each base64 string into an HTMLImageElement and store in state
  useEffect(() => {
    const loadedElements = [];
    base64Images.forEach((b64, idx) => {
      const img = new window.Image();
      img.onload = () => {
        let elementWidth, elementHeight, x, y;
        if (idx === 0) {
          // For the first image, set canvas dimensions to the image’s natural size.
          elementWidth = img.naturalWidth;
          elementHeight = img.naturalHeight;
          x = 0;
          y = 0;
          setCanvasDimensions({ width: elementWidth, height: elementHeight });
        } else {
          // For subsequent images, use a default size and position.
          elementWidth = img.naturalWidth / 2;
          elementHeight = img.naturalHeight / 2;
          x = 50 + idx * 50;
          y = 50 + idx * 50;
        }
        loadedElements.push({
          image: img,
          x,
          y,
          width: elementWidth,
          height: elementHeight,
          isSelected: false,
          opacity: 1, // Default opacity (fully opaque)
        });
        if (loadedElements.length === base64Images.length) {
          setElements(loadedElements);
          drawAll(loadedElements);
        }
      };
      img.src = `data:image/jpeg;base64,${b64}`;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base64Images]);

  // A helper to re-draw all elements on the canvas
  const drawAll = (elems) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw each element with its specified opacity
    elems.forEach((el, index) => {
      ctx.save();
      ctx.globalAlpha = el.opacity !== undefined ? el.opacity : 1;
      ctx.drawImage(el.image, el.x, el.y, el.width, el.height);
      ctx.restore();
      // If this element is selected, draw a bounding box and handles
      if (index === selectedElementIndex) {
        drawBoundingBox(ctx, el);
      }
    });
  };

  // Draw bounding box and corner handles around the selected element
  const drawBoundingBox = (ctx, el) => {
    ctx.save();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(el.x, el.y, el.width, el.height);
    const handleSize = 10;
    // Top-left handle
    ctx.fillRect(
      el.x - handleSize / 2,
      el.y - handleSize / 2,
      handleSize,
      handleSize
    );
    // Top-right handle
    ctx.fillRect(
      el.x + el.width - handleSize / 2,
      el.y - handleSize / 2,
      handleSize,
      handleSize
    );
    // Bottom-left handle
    ctx.fillRect(
      el.x - handleSize / 2,
      el.y + el.height - handleSize / 2,
      handleSize,
      handleSize
    );
    // Bottom-right handle
    ctx.fillRect(
      el.x + el.width - handleSize / 2,
      el.y + el.height - handleSize / 2,
      handleSize,
      handleSize
    );
    ctx.restore();
  };

  // Check if a point (mx, my) is inside an element’s bounding box
  const isInsideElement = (mx, my, el) => {
    return (
      mx >= el.x &&
      mx <= el.x + el.width &&
      my >= el.y &&
      my <= el.y + el.height
    );
  };

  // Check if a point is in one of the corner handles; returns the handle if so.
  const getHandleIfClicked = (mx, my, el) => {
    const handleSize = 10;
    // Top-left
    if (
      mx >= el.x - handleSize / 2 &&
      mx <= el.x + handleSize / 2 &&
      my >= el.y - handleSize / 2 &&
      my <= el.y + handleSize / 2
    ) {
      return "tl";
    }
    // Top-right
    if (
      mx >= el.x + el.width - handleSize / 2 &&
      mx <= el.x + el.width + handleSize / 2 &&
      my >= el.y - handleSize / 2 &&
      my <= el.y + handleSize / 2
    ) {
      return "tr";
    }
    // Bottom-left
    if (
      mx >= el.x - handleSize / 2 &&
      mx <= el.x + handleSize / 2 &&
      my >= el.y + el.height - handleSize / 2 &&
      my <= el.y + el.height + handleSize / 2
    ) {
      return "bl";
    }
    // Bottom-right
    if (
      mx >= el.x + el.width - handleSize / 2 &&
      mx <= el.x + el.width + handleSize / 2 &&
      my >= el.y + el.height - handleSize / 2 &&
      my <= el.y + el.height + handleSize / 2
    ) {
      return "br";
    }
    return null;
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Iterate from top (last element drawn) to bottom
    for (let i = elements.length - 1; i >= 0; i--) {
      // Optionally skip the first element if you don't want to move it
      if (i === 0) continue;
      const el = elements[i];
      const handleClicked = getHandleIfClicked(mx, my, el);
      if (handleClicked) {
        setSelectedElementIndex(i);
        setSelectedHandle(handleClicked);
        setIsResizing(true);
        drawAll(elements);
        return;
      }
      if (isInsideElement(mx, my, el)) {
        setSelectedElementIndex(i);
        setIsDragging(true);
        const offsetX = mx - el.x;
        const offsetY = my - el.y;
        const updatedElems = [...elements];
        updatedElems[i] = { ...updatedElems[i], offsetX, offsetY };
        setElements(updatedElems);
        drawAll(updatedElems);
        return;
      }
    }
    // Deselect if clicked on empty space
    setSelectedElementIndex(null);
    drawAll(elements);
  };

  const handleMouseMove = (e) => {
    if (!isDragging && !isResizing) return;
    if (selectedElementIndex == null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const updatedElems = [...elements];
    const el = updatedElems[selectedElementIndex];
    if (isDragging) {
      el.x = mx - (el.offsetX || 0);
      el.y = my - (el.offsetY || 0);
    } else if (isResizing) {
      switch (selectedHandle) {
        case "tl": {
          const oldRight = el.x + el.width;
          const oldBottom = el.y + el.height;
          el.x = mx;
          el.y = my;
          el.width = oldRight - mx;
          el.height = oldBottom - my;
          break;
        }
        case "tr": {
          const oldLeft = el.x;
          const oldBottom = el.y + el.height;
          el.y = my;
          el.width = mx - oldLeft;
          el.height = oldBottom - my;
          break;
        }
        case "bl": {
          const oldRight = el.x + el.width;
          const oldTop = el.y;
          el.x = mx;
          el.width = oldRight - mx;
          el.height = my - oldTop;
          break;
        }
        case "br": {
          const oldLeft = el.x;
          const oldTop = el.y;
          el.width = mx - oldLeft;
          el.height = my - oldTop;
          break;
        }
        default:
          break;
      }
    }
    setElements(updatedElems);
    drawAll(updatedElems);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setSelectedHandle(null);
  };

  // Handle mouse wheel events to adjust opacity of the selected element.
  const handleWheel = (e) => {
    if (selectedElementIndex == null) return;
    e.preventDefault(); // Prevent default scroll behavior
    const updatedElems = [...elements];
    const el = updatedElems[selectedElementIndex];
    // Adjust opacity: scrolling down decreases opacity, scrolling up increases
    const delta = -e.deltaY / 1000; // Adjust the sensitivity as needed
    const currentOpacity = el.opacity !== undefined ? el.opacity : 1;
    const newOpacity = Math.min(1, Math.max(0, currentOpacity + delta));
    el.opacity = newOpacity;
    setElements(updatedElems);
    drawAll(updatedElems);
  };

  // Setup canvas event listeners (mousedown, mousemove, mouseup, wheel)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel);
    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
    };
  });

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        style={{ border: "1px solid black" }}
      />
    </div>
  );
};

export default DraggableCanvas;
