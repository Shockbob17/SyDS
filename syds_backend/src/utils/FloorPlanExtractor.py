import cv2
import numpy as np
from matplotlib import pyplot as plt
import os
import base64


class floorPlanExtractor():
    """
    Created another class to redo map extractor so there arent so many functions
    """
    def __init__(self, images):
        self.images = images
        self.extractedRegions = None
        self.extractedFloors = None

    def requestRegions(self):
        """
        Function used to send out the images in extracted regions.

        Returns a list of images in base64
        """
        if self.extractedRegions is None:
            self.batchExtract()
        exported = []
        for image in self.extractedRegions:
            image = self._makeTransparent(image)
            b64_image = self._imageToBase64(image, ext='.png')
            exported.append(b64_image)
        return exported
    
    def batchProcess(self):
        """
        Main function to be used to extract out the segmented map from the images
        
        Stores the extracted images within the self.extractedFloors value
        """
        warpedImages = []
        # dotted_images = []
        for image in self.images:
            warpedImage = self._processImage(image)
            # if warped_image is not None:
            #     # Convert the warped image (a NumPy array) to a Base64 string
            #     b64_image = self._imageToBase64(warped_image, ext='.png')
            #     warped_images.append(b64_image)
            # else:
            #     warped_images.append(None)
            warpedImages.append(warpedImage)
        self.extractedFloors = warpedImages

    def _processImage(self, source):
        """
        Main function that is used to process each image,  finding the largest quadrilateral
        and converting it into a storage of information.

        Returns a numpy array of the transformed image.
        """
        image = cv2.imread(source)
        if image is None:
            print("Could not open image:", source)
            return None
        else:
            rect = self._findLargestQuadrilateral(image)
            if rect is not None:
                # rect has shape (4,1,2)
                corners = rect.reshape((4, 2))  # Now it's (4,2)
                corners = self._orderPoints(corners)
                transformedImage = self._fourPointTransform(image, corners)
                return transformedImage
    def _orderPoints(self, pts):
        """
        Helper Function used to order th points in the order of 
        top-left, top-right, bottom-right, bottom-left

        Returns a numpy array of the coordinates in the above config
        """
        rect = np.zeros((4,2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]  # top-left
        rect[2] = pts[np.argmax(s)]  # bottom-right

        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]  # top-right
        rect[3] = pts[np.argmax(diff)]  # bottom-left
        
        return rect
    
    def _fourPointTransform(self, image, pts):
        """
        Helper function used to transorm an image that is cut out from four points
        
        Returns a numpy array of the processed image
        """
        rect = self._orderPoints(pts)
        (tl, tr, br, bl) = rect
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))
        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))
        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]], dtype = "float32")
        # compute the perspective transform matrix and then apply it
        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
        # return the warped image
        return warped
    
    def batchExtract(self):
        """
        Main function used to perform the extract Largest region on each of the extracted floors
    
        I am also setting the first image to be a width of 600px

        Stores the extracted images within the self.extractedRegions
        """
        if self.extractedFloors is None:
            self.batchProcess()
        
        extractedRegions = []
        for image in self.extractedFloors:
            extractedRegions.append(self._extractLargestRegion(image))

        finalized = []
        for index, image in enumerate(extractedRegions):
            if index == 0:
                h0, w0 = image.shape[:2]
                newH = int(h0 * 600/w0)
                resizedImage = cv2.resize(image, (600, newH), interpolation=cv2.INTER_LINEAR)
                finalized.append(resizedImage)
            else:
                referenceImage = finalized[0]
                scaled = self._scaleDownRegions(referenceImage, image)
                finalized.append(scaled)

        self.extractedRegions = finalized
    
    def _findLargestQuadrilateral(self,image):
        """
        Finds the largest 4-sided contour (quadrilateral) in the image.
        
        Returns the approximated contour (4 points) if found, otherwise returns None.
        """
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        # Edge detection with Canny
        edged = cv2.Canny(blurred, 50, 200)
        
        # Use a morphological closing to help join broken edges
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        closed = cv2.morphologyEx(edged, cv2.MORPH_CLOSE, kernel)
        
        # Find contours in the edged image
        contours, _ = cv2.findContours(closed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        largestArea = 0
        bestApprox = None
        # Loop over the contours
        for cnt in contours:
            # Approximate the contour to a polygon
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
            
            # Check if it has 4 points
            if len(approx) == 4:
                area = cv2.contourArea(approx)
                if area > largestArea:
                    largestArea = area
                    bestApprox = approx
                    
        return bestApprox

    def _scaleDownRegions(self, referenceImage, inputImage):
        """
        Function used to make sure all images are at most as tall as the first floor
        """
        wRef, hRef = referenceImage.shape[:2]
        w,h = inputImage.shape[:2]

        resizedImage = inputImage
        if h > hRef:
            newWidth = int(w * hRef/h)
            resizedImage = cv2.resize(inputImage, (newWidth, hRef), interpolation=cv2.INTER_LINEAR)

        return resizedImage
    

    def _filterContours(self,contours, image_area):
        validContours = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < image_area * 0.01:
                continue
                
            x,y,w,h = cv2.boundingRect(cnt)
            aspect_ratio = float(w)/h 
            if not (0.3 < aspect_ratio < 3.5):
                continue

            hull = cv2.convexHull(cnt)
            hull_area =  cv2.contourArea(hull)
            solidarity = area/float(hull_area) if hull_area > 0 else 0
            if solidarity < 0.6:
                continue

            validContours.append(cnt)

        return validContours

    def _extractLargestRegion(self, image):
        """
        This is a function that is used to extract the largest region
        This is hopefully the map of the area.

        Problem is that this probably means it can only work for maps with only one floor

        Returns a numpy array of the cropped region
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 5)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5,5))
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        filtered_contours = self._filterContours(contours, image.shape[0] * image.shape[1])
        if filtered_contours:
            # Find the largest contour by area
            largest_contour = max(filtered_contours, key=cv2.contourArea)

            # Create a mask for the largest region
            mask = np.zeros_like(gray)
            cv2.drawContours(mask, [largest_contour], -1, 255, thickness=cv2.FILLED)
            mask_colored = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)

            # Extract the region
            largest_region = cv2.bitwise_and(image, mask_colored)

            # Find bounding box around the extracted region
            x, y, w, h = cv2.boundingRect(largest_contour)
            cropped_region = largest_region[y:y+h, x:x+w]  # Crop to remove black areas

            return cropped_region
        else:
            print("No valid large contours detected.")

    def _makeTransparent(self, image, color=(0, 0, 0 )):
        image_copy = image.copy()

        if image_copy.shape[2] == 3:  # If the image is RGB
            image_copy = cv2.cvtColor(image_copy, cv2.COLOR_BGR2BGRA)

        # Create a mask for the target color
        mask = np.all(image_copy[:, :, :3] == color, axis=-1)

        # Set the alpha channel to 0 for the matching pixels
        image_copy[mask, 3] = 0

        return image_copy
    
    def _imageToBase64(self,image_array, ext='.png'):
        """
        Helper function used to encode a numpy array into a
        base64 image that can be decoded using utf

        Returns the base64 string of the image
        """
        # Encode the image as JPEG or PNG
        success, encodedImage = cv2.imencode(ext, image_array)
        if not success:
            return None
        # Convert the encoded image to a Base64 string
        b64_bytes = base64.b64encode(encodedImage)
        return b64_bytes.decode('utf-8')    