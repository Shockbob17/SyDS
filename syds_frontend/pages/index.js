import { useState } from "react";
import styles from "@/styles/GridCreator.module.css";

const GridCreator = () => {
  const rows = 10;
  const cols = 10;
  const initialGrid = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(0));

  const actions = ["Empty", "Filled", "Trash", "Wall"];

  const [grid, setGrid] = useState(initialGrid);
  const [selectedAction, setSelectedAction] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false); // Track mouse down state

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

  return (
    <div className={styles.centerer} onMouseUp={() => setIsMouseDown(false)}>
      <div
        className={styles.gridContainer}
        style={{
          gridTemplateColumns: `repeat(${cols}, 50px)`,
          gridTemplateRows: `repeat(${rows}, 50px)`,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((item, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`${styles.GridBoxes} ${styles[actions[item]]}`}
              onMouseDown={() => {
                setIsMouseDown(true);
                updateGrid(rowIndex, colIndex);
              }}
              onMouseEnter={() => {
                if (isMouseDown) updateGrid(rowIndex, colIndex);
              }}
            />
          ))
        )}
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
    </div>
  );
};

export default GridCreator;
