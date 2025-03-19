from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Union
import json

from src.utils.FloorPlanExtractor import floorPlanExtractor
from src.utils.gridSolver import gridSolver
from src.utils.mapCropper import mapCropper

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow requests from frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


@app.post("/uploadImages")
async def findImage(images: List[UploadFile] = File(...)):
    # Save the uploaded files to temporary locations
    temp_file_paths = []
    for image in images:
        contents = await image.read()
        temp_path = f"/tmp/{image.filename}"
        with open(temp_path, "wb") as f:
            f.write(contents)
        temp_file_paths.append(temp_path)

    # Process the images with mapExtractor
    extractor = floorPlanExtractor(temp_file_paths)
    processed_images = extractor.requestRegions()

    return {"status": "success", "results": processed_images}



@app.post("/extractingWalkway")
async def extractingWalkway(
    images: List[UploadFile] = File(...),
    drawnRegions: str = Form(...)
):
    regions = json.loads(drawnRegions)
    temp_file_paths = []
    for image in images:
        contents = await image.read()
        temp_path = f"/tmp/{image.filename}"
        with open(temp_path, "wb") as f:
            f.write(contents)
        temp_file_paths.append(temp_path)
    extractor = mapCropper(temp_file_paths, regions)
    processed_images = extractor.requestWalkways()
    return {"status": "success", "results": processed_images}


@app.post("/findRoutes")
async def find_routes(request: Request):
    try:
        data = await request.json()  # Extract raw JSON data
        grid = data.get("grid")  # Get 'grid' key
        solver = gridSolver(grid)
        print(solver.routes)
        if not grid or not isinstance(grid, list):
            raise HTTPException(status_code=400, detail="Invalid grid format")

        # Example: Dummy response for testing
        result = solver.routes
        

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
