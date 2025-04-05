import base64
import numpy as np
import cv2
from skimage.morphology import skeletonize, remove_small_objects
from skimage.measure import label, regionprops
import matplotlib.pyplot as plt
from skimage.draw import line

def extractRoutesArray(base64Img):
    """
    Returns the extracted routes as a Numpy array of the possible paths
    """
    image = base64ToImage(base64Img)    
    gray = cv2.cvtColor (image, cv2.COLOR_BGR2GRAY)
    mask = cv2.inRange(gray, 50, 150)

    skeleton = skeletonize(mask > 0)
    labeled = label(skeleton)
    pruned = remove_small_objects(labeled, min_size=50)
    pruned = filterRegionsOutOfRange(pruned, min_area=100, max_area=200)
    skeleton_pruned = pruned > 0
    return skeleton_pruned.astype(np.uint8)

def extractOuterWalls(base64Img):
    """
    Returns the list of coordinates that makes up the external walls of the building
    """
    image = base64ToImage(base64Img)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 5)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5,5))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if len(contours) == 0:
        print("No contours found")
    else:
        contour = max(contours, key =cv2.contourArea)
        epsilon = 0.003 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)

        snappedPts = []
        for i in range(len(approx)):
            p1 = tuple(approx[i][0])
            p2 = tuple(approx[(i + 1) % len(approx)][0])
            # Make sure to go check and fix this later
            # This is meant to fix the points however, newP2, the fixed point, is not being used
            newP1, newP2 = snapAngle(p1,p2)
            snappedPts.append(newP1)
        snappedPts.append(snappedPts[0])
        snappedPts = np.array(snappedPts, dtype=np.int32).reshape((-1, 1, 2))
        return snappedPts
    
def createNewPathWithCoordinate(coord, skeleton, limit):
    """
    Returns numpy array with an additional line drawn between the coord and the closest point on the skeleton if the coord is within the limit
    """
    new_skeleton = skeleton.copy()
    
    directions = [
        (0, -1),
        (0, 1),    
        (-1, 0),  
        (1, 0),    
        (-1, -1), 
        (1, -1),   
        (-1, 1),   
        (1, 1)     
    ]
    
    found_points = {}
    height, width = new_skeleton.shape
    
    for dx, dy in directions:
        found = None
        for i in range(1, limit + 1):
            new_x = coord[0] + dx * i
            new_y = coord[1] + dy * i
            if new_x < 0 or new_x >= width or new_y < 0 or new_y >= height:
                break
            if new_skeleton[new_y, new_x] != 0:
                found = (new_x, new_y)
                break
        if found:
            found_points[(dx, dy)] = found

    if not found_points:
        print("No points found within the limit.")
        plt.figure(figsize=(10, 8))
        plt.imshow(new_skeleton, cmap='gray')
        plt.title("Modified Skeleton (No New Path Found)")
        plt.axis('off')
        plt.show()
        return new_skeleton, {}
    
    shortest_distance = float('inf')
    shortest_point = None
    
    for d, point in found_points.items():
        distance = np.sqrt((point[0] - coord[0])**2 + (point[1] - coord[1])**2)
        if distance < shortest_distance:
            shortest_distance = distance
            shortest_point = point

    rr, cc = line(coord[1], coord[0], shortest_point[1], shortest_point[0])
    new_skeleton[rr, cc] = 1 
    
    return new_skeleton

def gettingTenantWalls(regions, shape):
    """
    Returns a dictionary of list of regions
    Each region is a list of points that can be used to draw the tenants
    """
    regionPoints = {}
    for ridx, region in enumerate(regions):
        regionType = shape.get(str(ridx), -1)
        currentRegions = regionPoints.get(regionType, [])
        # Fine the list of coordinates that can define the regions and returns [(x,y), (x,y) ....] and adds into list of regions to create a list of list
        tunedPoints = processPoints(region)
        currentRegions.append(tunedPoints)
        regionPoints[regionType] = currentRegions  
    return regionPoints

  
# Actually the helper functions
def plotNumpyArrayOverImage(image, skeleton, title="---"):
    """
    Takes an image and a numpy array of the same dimensions and draws the skeleton over the image
    """
    overlay = image.copy()
    overlay[skeleton == 1] = [0, 0, 255]  # Red skeleton lines

    plt.figure(figsize=(10, 8))
    plt.imshow(cv2.cvtColor(overlay, cv2.COLOR_BGR2RGB))
    plt.title(title)
    plt.axis('off')
    plt.show()

def plotNodesOverImage(image, nodes, figSize = (10,8), markerSize =8, title="---"):
    """
    Function that is used to draw the nodes over a background image
    """
    plt.figure(figsize=figSize)
    
    # If a background image is provided, show it.
    plt.imshow(image, cmap='gray')
    
    # Plot each node as a red circle
    for (x, y) in nodes:
        plt.plot(x, y, 'ro', markersize=markerSize)
    
    plt.title(title)
    plt.axis('off')
    plt.show()

def plotLinesOverImage(image, lines, figSize = (10,8), title="---"):
    """
    Function that is used to draw lines over the iamge
    """
    plt.figure(figsize=figSize)
    
    # If a background image is provided, show it.
    cv2.drawContours(image, [lines], -1, (0,0,255), 2)
    plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.title(title)
    plt.axis('off')
    plt.show()

def plotPOIOverImage(image, POIDict, figSize = (10,8), title="---"):
    """
    Given a dictionary like {1: [[(x,y),(x,y) ...],[(x,y),(x,y) ...], ....], 2: ....}
    Plots out the POI on the image
    """
    plt.figure(figsize=figSize)
    
    # If a background image is provided, show it.
    for index, listTenants in POIDict.items():
        for tenant in listTenants:
            cnt = np.array(tenant, dtype=np.int32).reshape((-1, 1, 2))
            cv2.drawContours(image, [cnt], -1, (0,0,255), 2)
    plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    plt.title(title)
    plt.axis('off')
    plt.show()


def base64ToImage(base64_string):
    """
    Function that is used to load a base64 image as a numpy array for parsing by cv
    """
    if base64_string.startswith("data:image"):
        base64_string = base64_string.split(",")[1]
    image_bytes = base64.b64decode(base64_string)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

def filterRegionsOutOfRange(labeled_image, min_area, max_area):
    """
    Given a labeled image, returns a new labeled image that keeps only
    regions with area outside the range [min_area, max_area].
    """
    filtered = np.zeros_like(labeled_image)
    
    for region in regionprops(labeled_image):
        # Only keep regions with area NOT between min_area and max_area.
        if not (min_area <= region.area <= max_area):
            filtered[labeled_image == region.label] = region.label
    return filtered

def snapAngle(p1,p2):
    """
    Function that is used to check if a line drawn between two coordinates is more horizontal or vertical
    It will then force the line to go left right up or down, removing diagonal lines
    """
    dx = p2[0] - p1[0]
    dy = p2[1] - p1[1]
    if abs(dx) < abs(dy):
        return (p1[0], p1[1]), (p1[0], p2[1])
    else:
        return (p1[0], p1[1]), (p2[0], p1[1])
    
def processPoints(pointsDict):
    """
    Given a list of points in the form of a dictionary, translates them into a list of points that can be used to draw the tenant
    """
    refinedPoints = []
    for index, point in enumerate(pointsDict):
        point = (int(point['x']), int(point['y']))
        if index == 0:
            initialPoint = point
            refinedPoints.append(initialPoint)
        else:
            referencePoint = refinedPoints[-1]
            if (index == len(pointsDict) - 1):
                startingPoint = refinedPoints[0]
                if checkHorizontal(startingPoint, point):
                    newPoint = (int(point[0]), int(startingPoint[1]))
                else:
                    newPoint = (int(startingPoint[0]), int(point[1]))
                refinedPoints.append(newPoint)
            else:
                if (checkHorizontal(referencePoint, point)):
                    newPoint = (int(point[0]), int(referencePoint[1]))
                else:
                    newPoint = (int(referencePoint[0]), int(point[1]))
                refinedPoints.append(newPoint)
    return refinedPoints

def checkHorizontal(referencePoint, point):
    """
    Given two points where the points could either be dict with {x: int(), y: int ()} or tuple with (x,y)
    Determines if the point is horizontal

    Returns true if the lines is more horizontal
    Returns false if the line is more vertical
    """
    if (type(referencePoint) == tuple):
        referencePoint ={'x' : referencePoint[0], 'y': referencePoint[1]}
    if (type(point) == tuple):
        point ={'x' : point[0], 'y': point[1]}
    xRef, yRef = referencePoint['x'], referencePoint['y']
    x,y = point['x'], point['y']
    if abs(xRef - x) > abs(yRef - y):
        return True
    else:
        return False
