from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Union
import json

from src.utils.mapExtractor import mapExtractor
from src.utils.gridSolver import gridSolver

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
    extractor = mapExtractor(temp_file_paths)
    processed_images = extractor.requestRegions()

    return {"status": "success", "results": processed_images}

@app.post("/resizingImages")
async def resizingImages(
    images: List[UploadFile] = File(...),
    dataPoints: str = Form(...)
):
    # Parse the metadata from the form field (it should be a JSON string)
    metadata = json.loads(dataPoints)
    print("Metadata:", metadata)  # You can log or process the metadata as needed

    # Save the uploaded files to temporary locations
    temp_file_paths = []
    for image in images:
        contents = await image.read()
        temp_path = f"/tmp/{image.filename}"
        with open(temp_path, "wb") as f:
            f.write(contents)
        temp_file_paths.append(temp_path)

    extractor = mapExtractor(temp_file_paths, metadata)
    processed_images = extractor.requestScaledRegions()

    return {"status": "success", "results": processed_images}

@app.post("/extractingWalkway")
async def resizingImages(
    images: List[UploadFile] = File(...),
    dataPoints: str = Form(...),
    drawnRegions: str = Form(...)
):
    metadata = json.loads(dataPoints)
    print("Metadata:", metadata)

    regions = json.loads(drawnRegions)
    print("regions:", type(regions))
    temp_file_paths = []
    for image in images:
        contents = await image.read()
        temp_path = f"/tmp/{image.filename}"
        with open(temp_path, "wb") as f:
            f.write(contents)
        temp_file_paths.append(temp_path)

    extractor = mapExtractor(temp_file_paths, metadata, regions)
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
