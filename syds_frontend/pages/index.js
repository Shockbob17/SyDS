import { useEffect, useState } from "react";
import styles from "@/styles/GridCreator.module.css";
import axios from "axios";
import ThreeDGrid from "@/components/threejsViewer";

const GridCreator = () => {
  const rows = 10;
  const cols = 10;
  const initialGrid = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(0));

  const actions = ["Empty", "Tenant", "Trash", "Wall"];

  const [grid, setGrid] = useState(initialGrid);
  const [selectedAction, setSelectedAction] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [routes, setRoutes] = useState(null);
  const cellSize = 50;

  const findIdealRoutes = async (grid) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/findRoutes/",
        { grid }, // Make sure grid is passed correctly
        { headers: { "Content-Type": "application/json" } } // Ensure JSON format
      );

      // console.log("Received Routes:", response.data);
      setRoutes(response.data);
      return response.data; // Return the response for further use
    } catch (error) {
      console.error(
        "Error retrieving routes:",
        error.response?.data || error.message
      );
      return null;
    }
  };

  // Update grid when clicking or dragging
  const updateGrid = (rowIndex, colIndex) => {
    setGrid((prevGrid) =>
      prevGrid.map((row, r) =>
        row.map((cell, c) =>
          r === rowIndex && c === colIndex ? selectedAction : cell
        )
      )
    );
  };

  const drawLine = (coord1, coord2) => {
    /*
    Assuming that the coords come in array
    */
    const canvas1 = document.getElementById("pathCanvas").getContext("2d");
    canvas1.lineWidth = 1;
    canvas1.beginPath();
    const xCord1 = (coord1[0] + 0.5) * cellSize + coord1[0] * 2;
    const yCord1 = (coord1[1] + 0.5) * cellSize + coord1[1] * 2;
    // console.log(xCord1);
    canvas1.moveTo(xCord1, yCord1);
    const xCord2 = (coord2[0] + 0.5) * cellSize + coord2[0] * 2;
    const yCord2 = (coord2[1] + 0.5) * cellSize + coord2[1] * 2;
    // console.log(xCord2);
    canvas1.lineTo(xCord2, yCord2);
    canvas1.stroke();
    canvas1.imageSmoothingEnabled = false;
  };

  const clearCanvas = () => {
    const canvas1 = document.getElementById("pathCanvas");
    const ctx = canvas1.getContext("2d");
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);
  };

  useEffect(() => {
    clearCanvas();
    // console.log(routes);
    if (routes && Object.keys(routes).length > 0) {
      Object.entries(routes).forEach(([routeName, coordinates]) => {
        // console.log(`Route Name: ${routeName}, Coordinates:`, coordinates);
        coordinates.forEach((item, index) => {
          if (index != 0) {
            // console.log(coordinates[index - 1]);
            // console.log(coordinates[index]);
            drawLine(coordinates[index - 1], coordinates[index]);
          }
        });
      });
    }
  }, [routes]);

  return (
    <div className={styles.horizontalSpacer}>
      <div className={styles.centerer} onMouseUp={() => setIsMouseDown(false)}>
        <div>
          <div
            className={styles.gridContainer}
            style={{
              gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            }}
          >
            <canvas
              id="pathCanvas"
              style={{
                position: "absolute",
                width: (cellSize + 2) * rows,
                height: (cellSize + 2) * cols,
                zIndex: 0,
              }}
              width={(cellSize + 2) * rows}
              height={(cellSize + 2) * cols}
            ></canvas>
            {grid.map((row, rowIndex) =>
              row.map((item, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`${styles.GridBoxes} ${styles[actions[item]]}`}
                  onMouseDown={() => {
                    setIsMouseDown(true);
                    updateGrid(rowIndex, colIndex);
                  }}
                  style={{ width: cellSize, height: cellSize }}
                  onMouseEnter={() => {
                    if (isMouseDown) updateGrid(rowIndex, colIndex);
                  }}
                />
              ))
            )}
          </div>
        </div>

        <div className={styles.toolbar}>
          {actions.map((item, index) => (
            <div
              key={index}
              className={`${styles.iconContainers} ${
                selectedAction === index ? styles.selected : ""
              }`}
              onClick={() => setSelectedAction(index)}
            >
              <div className={`${styles[item]}`} />
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            findIdealRoutes(grid);
          }}
        >
          Solve Routes
        </button>
      </div>
      <ThreeDGrid grid={grid} routes={routes} />
    </div>
  );
};

export default GridCreator;
