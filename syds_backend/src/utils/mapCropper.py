import cv2
import numpy as np
from matplotlib import pyplot as plt
import os
import base64

class mapCropper():
    def __init__(self, rawImages, regions):
        self.rawImages = rawImages
        self.regions = regions
        self.extractedWalways = None


    def requestWalkways(self):
        if self.extractedWalways is None:
            self.batchExtractWalkWays()
        exported = []
        for image in self.extractedWalways:
            image = self._makeTransparent(image)
            b64_image = self._imageToBase64(image, ext='.png')
            exported.append(b64_image)
        return exported

    def batchExtractWalkWays(self):
        walkwayList = []
        for index, image in enumerate(self.rawImages):
            image = cv2.imread(image)
            print(image)
            print("HERE")
            print(type(image))
            mask = np.ones(image.shape[:2], dtype=np.uint8) * 255  # 255 means keep the image
            for region in self.regions.get(str(index), []):
                pts = np.array([[int(pt['x']), int(pt['y'])] for pt in region], dtype=np.int32)
                pts = pts.reshape((-1, 1, 2))
                cv2.fillPoly(mask, [pts], 0)

            result = cv2.bitwise_and(image, image, mask=mask)
            walkwayList.append(result)
        self.extractedWalways = walkwayList
    
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
    
if __name__ == "__main__":
    pass