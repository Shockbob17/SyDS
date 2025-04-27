import cv2
import numpy as np
from matplotlib import pyplot as plt
import os
import base64

class processNumpy():
    def __init__(self, sources, regions, labels):
        images = []
        for source in sources:
            images.append(self._convertBase64ToNumpy(source))
        self.walkway = images
        self.regions = regions
        self.labels = labels


    def _convertBase64ToNumpy(self, source):
        image = cv2.imread(source)
