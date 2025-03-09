import * as THREE from "three";
import { useEffect } from "react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const ThreeDGrid = ({ grid, routes }) => {
  const colorPallete = {
    0: "#ffffff",
    1: "#D6E5BD",
    2: "#F9E1A8",
    3: "#BCD8EC",
  };
  useEffect(() => {
    // Remove previous renderer if it exists
    const existingContainer = document.getElementById("threejs-container");
    if (!existingContainer) return;
    existingContainer.innerHTML = ""; // Clear previous renderer

    // Setup scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45, // Standard FOV
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(400, 400, 400); // Move camera back
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 600);
    existingContainer.appendChild(renderer.domElement);

    // Add OrbitControls for interactive camera movement
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 100;
    controls.maxDistance = 1000;
    controls.target.set(0, 0, 0);
    controls.update();

    const objects = [];
    const cellSize = 50;

    // Create the floor
    if (grid) {
      const floorGeometry = new THREE.BoxGeometry(
        cellSize * grid.length,
        1,
        cellSize * grid[0].length
      );
      const floorMaterial = new THREE.MeshBasicMaterial({
        color: colorPallete[0],
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.position.set(0, 0, 0);
      scene.add(floor);
      objects.push(floor);
    }

    // Add cubes based on grid data
    grid.forEach((row, rowIndex) => {
      row.forEach((item, index) => {
        if (item !== 0) {
          console.log("add cube");
          const cubeGeometry = new THREE.BoxGeometry(
            cellSize,
            cellSize,
            cellSize
          ); // Make cube real size
          const cubeMaterial = new THREE.MeshBasicMaterial({
            color: colorPallete[item],
          });
          const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

          cube.position.set(
            index * cellSize - 0.5 * grid.length * cellSize + 0.5 * cellSize,
            cellSize / 2, // Move up to sit on floor
            rowIndex * cellSize -
              0.5 * grid[0].length * cellSize +
              0.5 * cellSize
          );
          scene.add(cube);
          objects.push(cube);
        }
      });
    });

    if (routes && Object.keys(routes).length > 0) {
      Object.entries(routes).forEach(([routeName, coordinates]) => {
        console.log(`Route Name: ${routeName}, Coordinates:`, coordinates);
        coordinates.forEach((item, index) => {
          if (index != 0) {
            // console.log(coordinates[index - 1]);
            // console.log(coordinates[index]);
            // console.log(coordinates);
            const cubeGeometry = new THREE.BoxGeometry(
              cellSize / 2,
              cellSize / 2,
              cellSize / 2
            ); // Make cube real size
            const cubeMaterial = new THREE.MeshBasicMaterial({
              color: "#DCCCEC",
            });
            const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

            cube.position.set(
              coordinates[index][0] * cellSize -
                0.5 * grid.length * cellSize +
                0.5 * cellSize,
              cellSize / 2, // Move up to sit on floor
              coordinates[index][1] * cellSize -
                0.5 * grid[0].length * cellSize +
                0.5 * cellSize
            );
            scene.add(cube);
            objects.push(cube);
          }
        });
      });
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Update camera controls
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup function to dispose of WebGL context properly
    return () => {
      console.log("Cleaning up WebGL context...");
      objects.forEach((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
        scene.remove(obj);
      });
      controls.dispose(); // Remove event listeners from OrbitControls
      renderer.dispose();
      existingContainer.innerHTML = "";
      console.log("WebGL context successfully cleaned up.");
    };
  }, [grid, routes]);

  return <div id="threejs-container"></div>;
};

export default ThreeDGrid;
