import os
import numpy as np
import geopandas as gpd
import matplotlib.pyplot as plt
from shapely.geometry import Polygon, Point, LineString
from shapely.errors import ShapelyDeprecationWarning
import warnings
import pandas as pd
import matplotlib.patches as mpatches

warnings.filterwarnings("ignore", category=ShapelyDeprecationWarning)

COMMON_CRS = None

def ensure_closed_polygon(points):
    """
    Convert input points (which may be provided as a NumPy array, a list of lists,
    or dictionaries) to a list of (x, y) tuples of floats and ensure the polygon is closed.
    """
    new_points = []
    for pt in points:
        if isinstance(pt, dict):
            new_pt = (float(pt["x"]), float(pt["y"]))
        elif isinstance(pt, np.ndarray):
            # If extra dimensions exist, flatten them.
            new_pt = tuple(pt.flatten().astype(float))
        elif isinstance(pt, list):
            # If the first element is a list or array, unwrap it.
            if len(pt) > 0 and isinstance(pt[0], (list, np.ndarray)):
                new_pt = tuple(np.array(pt[0], dtype=float))
            else:
                new_pt = tuple(float(x) for x in pt)
        else:
            new_pt = (float(pt[0]), float(pt[1]))
        new_points.append(new_pt)
    if not np.array_equal(np.array(new_points[0]), np.array(new_points[-1])):
        new_points.append(new_points[0])
    return new_points

def visualise_combined_features(walkway_array, outer_wall_points, block_dict, bin_locations, floor, grid_size=1):
    features = []

    if outer_wall_points is not None and len(outer_wall_points) >= 4:
        cleaned_outer = ensure_closed_polygon(outer_wall_points)
        try:
            outer_wall_poly = Polygon(cleaned_outer)
            if outer_wall_poly.is_valid:
                features.append({"feature": "outer_wall", "geometry": outer_wall_poly})
        except Exception as e:
            print(f"Error with outer wall polygon: {e}")

    rows, cols = walkway_array.shape
    for i in range(rows):
        for j in range(cols):
            if walkway_array[i, j] == 0:
                continue
            poly = Polygon([
                (j * grid_size, i * grid_size),
                ((j + 1) * grid_size, i * grid_size),
                ((j + 1) * grid_size, (i + 1) * grid_size),
                (j * grid_size, (i + 1) * grid_size)
            ])
            features.append({"feature": "walkway", "geometry": poly})

    type_map = {0: "empty_area", 1: "tenant", 2: "toilet", 3: "staircase"}
    for key, poly_list in block_dict.items():
        feature_type = type_map.get(int(key), f"unknown_{key}")
        for coords in poly_list:
            if len(coords) < 3:
                continue
            cleaned_coords = ensure_closed_polygon(coords)
            try:
                region_poly = Polygon(cleaned_coords)
                features.append({"feature": feature_type, "geometry": region_poly})
            except Exception as e:
                print(f"Error with {feature_type} polygon: {e}")

    gdf = gpd.GeoDataFrame(features, crs=COMMON_CRS)
    gdf["geometry"] = gdf["geometry"].buffer(0)

    bin_gdf = gpd.GeoDataFrame({
        "feature": ["bin"] * len(bin_locations),
        "geometry": [Point(x, y) for x, y in bin_locations]
    }, crs=None)

    color_mapping = {
        "outer_wall": "#EDE6D6",
        "walkway": "#D9DBCE",
        "empty_area": "#A7A7A7",
        "tenant": "#CAC1B8",
        "toilet": "#B4CCCE",
        "staircase": "#ACA7A1",
        "bin": "red"
    }

    fixed_categories = ["outer_wall", "walkway", "empty_area", "tenant", "toilet", "staircase"]
    gdf["feature"] = pd.Categorical(gdf["feature"], categories=fixed_categories, ordered=True)
    gdf["color"] = gdf["feature"].map(color_mapping)

    fig, ax = plt.subplots(figsize=(12, 10))
    patches = [mpatches.Patch(color=color, label=label) for label, color in color_mapping.items() if label != "bin"]
    patches.append(plt.Line2D([0], [0], marker='o', color='w', label='bin', markerfacecolor='red', markersize=8))
    ax.legend(handles=patches, title="Feature Types")

    gdf.plot(color=gdf["color"], edgecolor="grey", ax=ax)
    bin_gdf.plot(ax=ax, color='red', markersize=50)
    ax.set_title(f"Combined Features with Bin Locations for Floor {floor}")
    ax.set_aspect("equal")
    ax.invert_yaxis()
    plt.show()

    return gdf, bin_gdf

def save_path_segments_shapefile(path_list, floor, output_dir="shapes"):
    """
    Given a dictionary {key: [ ((x1,y1),(x2,y2)), ((x2,y2),(x3,y3)), ... ], ... },
    each entry in the list is a *two-point segment*.
    
    We'll build a GeoDataFrame of LineStrings (one for each pair),
    then save it as a shapefile.
    """
    if not path_list:
        print("No path data found; skipping.")
        return

    features = []
    for seg in path_list:
        # Each 'seg' is ((x1, y1), (x2, y2))
        pt1, pt2 = seg
        line_geom = LineString([pt1, pt2])

        features.append({
            "geometry": line_geom
        })

    gdf = gpd.GeoDataFrame(features, crs=COMMON_CRS)

    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, f"floor_{floor}_path_segments.shp")
    gdf.to_file(out_path)
    
    print(f"Path segments shapefile saved for floor {floor}: {out_path}")

    # Optional visualization
    fig, ax = plt.subplots(figsize=(10, 8))
    gdf.plot(ax=ax, linewidth=2, label="Path segments")
    ax.set_title(f"Floor {floor} - Path Segments")
    ax.set_aspect("equal")
    ax.invert_yaxis()
    plt.legend()
    plt.show()
    
    return gdf

def save_outerwall_shapefile(outer_wall_points, floor, output_dir="shapes"):
    """
    Convert outer wall points into a Polygon and save as a shapefile.
    """
    if outer_wall_points is not None and len(outer_wall_points) >= 4:
        cleaned_outer = ensure_closed_polygon(outer_wall_points)
        try:
            outer_poly = Polygon(cleaned_outer)
        except Exception as e:
            print(f"Error creating outer wall polygon for floor {floor}: {e}")
            return
        if outer_poly.is_valid:
            gdf = gpd.GeoDataFrame([{"feature": "outer_wall", "geometry": outer_poly}])
            print(f"Outwall Shape CRS: {gdf.crs}")
            gdf["geometry"] = gdf["geometry"].buffer(0)
            os.makedirs(output_dir, exist_ok=True)
            out_path = os.path.join(output_dir, f"floor_{floor}_outerwall.shp")
            gdf.to_file(out_path)
            print(f"Outer wall shapefile saved for floor {floor}: {out_path}")
            # Optional plot
            fig, ax = plt.subplots(figsize=(10, 8))
            gdf.plot(column="feature", cmap="tab20", legend=True, edgecolor="black", ax=ax)
            ax.set_title(f"Floor {floor} - Outer Wall")
            ax.set_aspect("equal", adjustable='datalim')
            ax.invert_yaxis()
            plt.show()
        else:
            print(f"Outer wall polygon for floor {floor} is invalid.")
    else:
        print(f"Not enough outer wall points for floor {floor}.")

def tenant_contour_to_lines_exact(contour, skip_indices):
    """
    Create line segments.
    - If index i is in skip_indices, we *skip* connecting i -> (i+1).
    - Otherwise, we create a line segment from (i) -> (i+1) [with wrap-around].
    This yields a list of two-point LineString objects, each corresponding to
    exactly one edge that 'plotPOIOverImage' would have drawn in red.
    """
    segments = []
    n = len(contour)
    for i in range(n):
        if i not in skip_indices:
            p1 = tuple(contour[i])
            p2 = tuple(contour[(i + 1) % n])
            segments.append(LineString([p1, p2]))
    return segments

def save_tenant_lines_shapefile_exact(tenant_dict, tenant_skipper_dict, floor, output_dir="shapes"):
    """
    Similar to 'save_tenant_lines_shapefile'.  This will produce
    a shapefile of many two-point LineStrings mirroring what you'd see on the image.
    """
    features = []
    
    for poi, contours in tenant_dict.items():
        skip_info = tenant_skipper_dict.get(poi, [])
        for idx, contour in enumerate(contours):
            if idx < len(skip_info):
                skip_indices = skip_info[idx]
            else:
                skip_indices = []
            
            segments = tenant_contour_to_lines_exact(contour, skip_indices)
            
            for seg in segments:
                features.append({
                    "poi": poi,
                    "geometry": seg
                })

    if not features:
        print(f"No tenant outlines found for floor {floor}.")
        return
    
    gdf = gpd.GeoDataFrame(features, crs=COMMON_CRS)
    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, f"floor_{floor}_tenant_lines.shp")
    gdf.to_file(out_path)
    print(f"Tenant outline lines shapefile saved for floor {floor}: {out_path}")
    
    fig, ax = plt.subplots(figsize=(10, 8))
    gdf.plot(ax=ax, linewidth=2, label="Tenant Outlines")
    ax.set_title(f"Floor {floor} - Tenant Outlines")
    ax.set_aspect("equal")
    ax.invert_yaxis()
    plt.legend()
    plt.show()
    
    return gdf

def save_bin_shapefile(bin_locations, floor, output_dir="shapes"):
    """
    Save a shapefile of bin point locations for a given floor.
    
    Parameters:
    - bin_locations: List of (x, y) tuples representing bin positions.
    - floor: Floor index or label as string.
    - output_dir: Directory to save shapefile in.
    """
    if not bin_locations:
        print(f"No bin locations provided for floor {floor}. Skipping.")
        return
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Create GeoDataFrame with Point geometries
    data = {
        "feature": ["bin"] * len(bin_locations),
        "geometry": [Point(x, y) for (x, y) in bin_locations]
    }
    gdf = gpd.GeoDataFrame(data, crs=COMMON_CRS)
    print(f"Bin shapefile format is: {gdf.crs}")
    
    shp_path = os.path.join(output_dir, f"floor_{floor}_bins.shp")
    gdf.to_file(shp_path)

    fig, ax = plt.subplots(figsize=(8, 6))
    gdf.plot(ax=ax, color='orange', markersize=50, label='Bin Locations')
    ax.set_title(f"Floor {floor} - Bin Locations")
    ax.legend()
    ax.set_aspect("equal", adjustable='datalim')
    ax.invert_yaxis()
    plt.show()
    print(f"Bin shapefile saved for floor {floor}: {shp_path}")

def save_agent_shapefile(agent_locations, floor, output_dir="shapes"):
    """
    Save a shapefile of bin point locations for a given floor.
    
    Parameters:
    - agent_locations: List of (x, y) tuples representing bin positions.
    - floor: Floor index or label as string.
    - output_dir: Directory to save shapefile in.
    """
    if not agent_locations:
        print(f"No agent locations provided for floor {floor}. Skipping.")
        return
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Create GeoDataFrame with Point geometries
    data = {
        "feature": ["agent"] * len(agent_locations),
        "geometry": [Point(x, y) for (x, y) in agent_locations]
    }
    gdf = gpd.GeoDataFrame(data, crs=COMMON_CRS)
    print(f"Agent shapefile format is: {gdf.crs}")
    
    shp_path = os.path.join(output_dir, f"floor_{floor}_agent.shp")
    gdf.to_file(shp_path)

    fig, ax = plt.subplots(figsize=(8, 6))
    gdf.plot(ax=ax, color='red', markersize=50, label='Agent Locations')
    ax.set_title(f"Floor {floor} - Agent Locations")
    ax.legend()
    ax.set_aspect("equal", adjustable='datalim')
    ax.invert_yaxis()
    plt.show()
    print(f"Agent shapefile saved for floor {floor}: {shp_path}")

def save_stair_shapefile(stair_locations, floor, output_dir="shapes"):
    """
    Save a shapefile of stair point locations for a given floor.
    
    Parameters:
    - stair_locations: List of (x, y) tuples representing stair positions.
    - floor: Floor index or label as string.
    - output_dir: Directory to save shapefile in.
    """
    if not stair_locations:
        print(f"No stair locations provided for floor {floor}. Skipping.")
        return
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Create GeoDataFrame with Point geometries
    data = {
        "feature": ["stair"] * len(stair_locations),
        "geometry": [Point(x, y) for (x, y) in stair_locations]
    }
    gdf = gpd.GeoDataFrame(data, crs=COMMON_CRS)
    print(f"Stair shapefile format is: {gdf.crs}")
    
    shp_path = os.path.join(output_dir, f"floor_{floor}_stairs.shp")
    gdf.to_file(shp_path)

    fig, ax = plt.subplots(figsize=(8, 6))
    gdf.plot(ax=ax, color='blue', markersize=50, label='Stair Locations')
    ax.set_title(f"Floor {floor} - Stair Locations")
    ax.legend()
    ax.set_aspect("equal", adjustable='datalim')
    ax.invert_yaxis()
    plt.show()
    print(f"Stair shapefile saved for floor {floor}: {shp_path}")