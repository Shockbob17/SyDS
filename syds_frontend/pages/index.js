import { useState } from "react";
import styles from "@/styles/GridCreator.module.css";

const GridCreator = () => {
  const rows = 4;
  const cols = 3;
  const initialGrid = Array(rows)
    .fill(null)
    .map(() => Array(cols).fill(0)); // Default state is 0 ("Empty")

  // Actions corresponding to different states
  const actions = ["Empty", "Filled", "Trash"];

  const [grid, setGrid] = useState(initialGrid);
  const [selectedAction, setSelectedAction] = useState(1); // Default to "Filled"

  // Handle cell click
  const handleClick = (rowIndex, colIndex) => {
    setGrid((prevGrid) =>
      prevGrid.map((row, r) =>
        row.map((cell, c) =>
          r === rowIndex && c === colIndex ? selectedAction : cell
        )
      )
    );
  };

  return (
    <div className={styles.centerer}>
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
              className={`${styles.GridBoxes} ${styles[actions[item]]}`} // Dynamic class based on state
              onClick={() => handleClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>

      <div className={styles.toolbar}>
        {actions.map((item, index) => (
          <div
            key={index}
            className={`${styles.GridBoxes} ${styles[item]}`}
            onClick={() => setSelectedAction(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default GridCreator;
