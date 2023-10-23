/** CSci-4611 Assignment 1 Support Code
 * Assignment concept and support code by Prof. Daniel Keefe, 2023
 * Inspired by Camille Utterbeck's "Text Rain" installation, 2000+
 * Copyright Regents of the University of Minnesota
 * Please do not distribute beyond the CSci-4611 course
 */

import * as gfx from 'gophergfx'

/**
 * A collection of helper routines for working with images stored in ImageData objects.
 * Feel free to add additional routines (e.g., image filters) if you like.  (We did in
 * our implementation.)
 */
export class ImageUtils
{
    /**
     * Creates a new ImageData object of the specified width and height.  Every byte in the data array
     * will be be initialized to 0 (i.e., black completely transparent pixels).
     */
    public static createBlank(width: number, height: number): ImageData
    {
        const nBytes = width * height * 4;
        return new ImageData(new Uint8ClampedArray(nBytes), width, height);
    }

    /**
     * Checks the image variable to determine if has already been created, then checks to see if it has
     * the desired width and height.  If these checks pass, then the function returns the existing image.
     * If either check fails, then the function creates a new ImageData object of the desired width and 
     * height and returns it.  In this case, the image will be initialized using ImageUtils.createBlank().   
     * @param image Can be null, undefined, or an existing image
     * @param width The desired width of the image
     * @param height The desired height of the image
     * @returns The current image if it matches the desired width and height or a new image that matches
     */
    public static createOrResizeIfNeeded(image: ImageData | undefined | null, width: number, height: number): ImageData
    {
        if (!(image instanceof ImageData) || image.width != width || image.height != height) {
            return this.createBlank(width, height);
        } else {
            return image;
        }
    }

    /**
     * Returns a new ImageData object that is a deep copy of the source image provided.  This includes copying
     * all of the pixel data from the source to the new image object.
     */
    public static clone(source: ImageData): ImageData
    {
        const copyOfPixelData = new Uint8ClampedArray(source.data);
        return new ImageData(copyOfPixelData, source.width, source.height);
    }

    /**
     * Copies the pixel data from the source image into the pixels of the destination image. 
     * @param source An existing ImageData object that is the source for the pixel data.
     * @param dest An existing ImageData object that is the destination for the pixel data.
     */
    public static copyPixels(source: ImageData, dest: ImageData): void
    {
        for (let i=0; i<source.data.length; i++) {
            dest.data[i] = source.data[i];
        }
    }

    public static convertToGrayscale(source: ImageData, dest: ImageData): void
    {
        //=========================================================================
        //Part 2.1 Convert to Grayscale
        //Iterate through the pixels in the source image data 
        //Calculate the grayscale value for each pixel
        //Set the corresponding pixel values (r,g,b,a) in the destination image data to the grayscale value
        //When this is complete, uncomment the corresponding line in RainingApp.ts  
        //Provide the appropriate parameters to that function to view the effect
        //=========================================================================

        const sourceData = source.data; // Get the source one-dimensional array containing the data in RGBA order
        const destData = dest.data; // Get the source one-dimensional array containing the data in RGBA order
        const h = source.height;
        const w = source.width;
        for (let i = 0; i < h; i++) {
            // Iterate through the pixels in the source image data by height and width
            for (let j = 0; j < w; j++) {
                const r_idx = (i * w + j) * 4; // get imageDataIndex of each pixel

                const r = sourceData[r_idx]; // Get R value
                const g = sourceData[r_idx+1]; // Get G value
                const b = sourceData[r_idx+2]; // Get B value
    
                // Calculate grayscale value
                const grayValue =  0.299 * r + 0.587 * g + 0.114 * b;
    
                // Set the corresponding pixel values (r,g,b,a) in the destination image data to the grayscale value
                destData[r_idx] = grayValue;     // Red
                destData[r_idx+1] = grayValue; // Green
                destData[r_idx+2] = grayValue; // Blue
            }
        }

    }

    public static convertToGrayscaleInPlace(image: ImageData): void
    {
        return this.convertToGrayscale(image, image);
    }

    public static mirror(source: ImageData, dest: ImageData): void
    {
        //=========================================================================
        //Part 2.2 Mirror the Image
        //Iterate through the pixels in the source image data
        //Calculate the mirrored pixel location
        //Set the corresponding pixel values (r,g,b,a) in the destination image data to the mirrored value
        //When this is complete, uncomment the corresponding line in RainingApp.ts  
        //Provide the appropriate parameters to that function to view the effect
        //=========================================================================

        const sourceData = source.data; // Get the source one-dimensional array containing the data in RGBA order
        const destData = dest.data; // Get the source one-dimensional array containing the data in RGBA order

        const cp = sourceData.slice(); // Copy the source arrary to prevent lost data from pixel data exchange 
        const h = source.height;
        const w = source.width;
        for (let i = 0; i < h; i++) {
            // Iterate through the pixels in the source image data by height and width
            for (let j = 0; j < w; j++) {
                const rSouceIdx = (i * w + j) * 4; // get imageDataIndex of each pixel in source

                const r = cp[rSouceIdx]; // Get R value
                const g = cp[rSouceIdx+1]; // Get G value
                const b = cp[rSouceIdx+2]; // Get B value
                const a = cp[rSouceIdx+3]; // Get A value

                // Calculate imageDataIndex of each pixel in dest
                const rDestIdx =  (i * w + (w - j - 1)) * 4; // Vertical Mirror only changes col value to (width - col - 1)
    
                // Set the corresponding pixel values (r,g,b,a) in the destination image data to the mirrored value
                destData[rDestIdx] = r;     // Red
                destData[rDestIdx+1] = g; // Green
                destData[rDestIdx+2] = b; // Blue
                destData[rDestIdx+3] = a; // Alpha
            }
        }
        
    }


    public static threshold(source: ImageData, dest: ImageData, threshold: number): void
    {
        //=========================================================================
        //Part 2.3 Threshold the Image
        //Iterate through the pixels in the source image data 
        //Check if the pixel's color channel value is greater than or equal to the threshold
        //Set the corresponding pixel values (r,g,b,a) in the destination image data to the appropriate value
        //based on the threshold result
        //When this is complete, uncomment the corresponding line in RainingApp.ts  
        //Provide the appropriate parameters to that function to view the effect
        //=========================================================================

        const sourceData = source.data; // Get the source one-dimensional array containing the data in RGBA order
        const destData = dest.data; // Get the source one-dimensional array containing the data in RGBA order
        const length = source.width * source.height * 4;
        for (let i = 0; i < length; i += 4) {

            // Get the graycale value of the mirrored-grayscale image
            const grayValue = sourceData[i];
    
            // If grayscale value >= threshold: set values (r,g,b,a) in destData to 255(white), otherwise 0 (black)
            const thresholdedValue = grayValue >= (threshold*255)? 255 : 0;
    
            // update values (r,g,b,a) in destData
            destData[i] = thresholdedValue;     // R
            //console.log(thresholdedValue);
            destData[i + 1] = thresholdedValue; // G
            destData[i + 2] = thresholdedValue; // B
            destData[i + 3] = sourceData[i + 3]; // A
        }

    }

     // --- Additional Helper Functions ---
     // You may find it useful to complete these to assist with some calculations of RainingApp.ts
    
    public static getRed(image: ImageData, col: number, row: number)
    {
        //Use the code from your quiz response to complete this helper function
        return (row * image.width + col) * 4;
    }

    public static getGreen(image: ImageData, col: number, row: number)
    {
       //Use the code from your quiz response to complete this helper function
       return (row * image.width + col) * 4 + 1;

    }

    public static getBlue(image: ImageData, col: number, row: number)
    {
        //Use the code from your quiz response to complete this helper function
        return (row * image.width + col) * 4 + 2;

    }

    public static getAlpha(image: ImageData, col: number, row: number)
    {
       //Use the code from your quiz response to complete this helper function
       return (row * image.width + col) * 4 + 3;

    }
}
