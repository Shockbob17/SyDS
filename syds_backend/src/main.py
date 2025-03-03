from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Union

app = FastAPI()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow requests from frontend
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

@app.post("/findRoutes")
async def find_routes(request: Request):
    try:
        data = await request.json()  # Extract raw JSON data
        grid = data.get("grid")  # Get 'grid' key
        print(grid)

        if not grid or not isinstance(grid, list):
            raise HTTPException(status_code=400, detail="Invalid grid format")

        # Example: Dummy response for testing
        result = {
            "routes": [
                {"shop": [2, 3], "bin": [2, 1], "path": [[2, 3], [2, 2], [2, 1]]},
                {"shop": [4, 3], "bin": [4, 1], "path": [[4, 3], [4, 2], [4, 1]]}
            ]
        }

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")
