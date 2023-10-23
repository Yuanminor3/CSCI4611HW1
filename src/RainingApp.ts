/** CSci-4611 Assignment 1 Support Code
 * Assignment concept and support code by Prof. Daniel Keefe, 2023
 * Inspired by Camille Utterbeck's "Text Rain" installation, 2000+
 * Copyright Regents of the University of Minnesota
 * Please do not distribute beyond the CSci-4611 course
 */

import * as gfx from 'gophergfx'
import { GUI, GUIController } from 'dat.gui'
import { VideoSourceManager } from './VideoSourceManager';
import { ImageUtils } from './ImageUtils';

export class RainingApp extends gfx.GfxApp {
    // --- constants ---
    private readonly FALLBACK_VIDEO = './TextRainInput.m4v';
    private readonly OPEN_SETTINGS_LABEL_TEXT = '▼ Open Settings';
    private readonly CLOSE_SETTINGS_LABEL_TEXT = '▲ Close Settings';

    private raindrop: gfx.Mesh2 = new gfx.Mesh2();
    private raindropCount: number;  // Initial count to limit # of rainDrops
    private timeLastDrop: number; // Record tim eof last rainDrop
    private wordIdx: number; // Record index of wordArray2
    //private raindrops: gfx.Mesh2[]; // Record spawned rainDrops

    // --- GUI related member vars ---
    // the gui object created using the dat.gui library.
    private gui: GUI;
    // the gui controllers defined in the constructor are tied to these member variables, so these
    // variables will update automatically whenever the checkboxes, sliders, etc. in the gui are changed.
    private _debugging: boolean;
    private _threshold: number;
    // the video source is also controlled by the GUI, but the logic is a bit more complex as we
    // do not know the names of the video devices until we are given permission to access them.  so,
    // we save a reference to the GUIController and option list in addition to the currentVideoDevice
    // variable that gets updated when the user changes the device via the gui.
    private videoSourceDropDown: GUIController;


    // --- Graphics related member vars ---
    private videoSourceManager: VideoSourceManager;
    private displayImage: ImageData | null;
    private obstacleImage: ImageData | null;
    private backgroundRect: gfx.Mesh2 | null;
    private raindropsParentNode: gfx.Node2;

    //====================================================================================================
    //Part 4.1 Select characters/words to display from some meaningful text (e.g., a poem, a song) 
    // that fits aesthetically with your vision for the user experience.

    //The Rain Song by Led Zeppelin
    private readonly wordArray2 = (
        `It is the springtime of my loving
        The second season I am to know
        You are the sunlight in my growing
        So little warmth I've felt before
        It isn't hard to feel me glowing
        I watched the fire that grew so low, oh
        It is the summer of my smiles
        Flee from me, keepers of the gloom
        Speak to me only with your eyes
        It is to you, I give this tune
        Ain't so hard to recognize, oh
        These things are clear to all from time to time, ooh`
    ).split(" ");


    //the word array that will be used to create the text rain
    private readonly wordArray = (
        `I never meant to cause you any sorrow
         I never meant to cause you any pain
         I only wanted one time to see you laughing
         I only wanted to see you
         Laughing in the purple rain
         Purple rain, purple rain
         I only want to see you
         Laughing in the purple rain`
    ).split(" ");
    //====================================================================================================

    // --- Getters and setters ---
    // any variables that can be changed from outside the class, including by the GUI, need to either be
    // declared public rather than private (this is usually faster to code and generally ok for small
    // projects) OR have getters & setters defined as below (this is generally better / safer practice).
    public get debugging() {
        return this._debugging;
    }

    public set debugging(value: boolean) {
        this._debugging = value;
    }

    public get threshold() {
        return this._threshold;
    }

    public set threshold(value: number) {
        this._threshold = value;
    }

    // --- Constructor ---
    // note: typescripts requires that we initialize all member variables in the constructor.
    constructor() {
        // initialize the base class gfx.GfxApp
        super();

        // this writes directly to some variables within the dat.gui library. the library does not
        // provide a nicer way to customize the text for the buttons used to open/close the gui.
        GUI.TEXT_CLOSED = this.CLOSE_SETTINGS_LABEL_TEXT;
        GUI.TEXT_OPEN = this.OPEN_SETTINGS_LABEL_TEXT;

        // initialize all member variables
        this._debugging = false;
        this._threshold = 0.5;
        this.displayImage = null;
        this.obstacleImage = null;
        this.backgroundRect = null;

        this.raindropCount = 0; // Initial count of rainDrop is 0
        this.timeLastDrop = 0; // Initial time of last rainDrop is 0s
        this.wordIdx = 0;
        //this.raindrop = new gfx.Node2();
        this.raindropsParentNode = new gfx.Node2();
        


        this.videoSourceManager = new VideoSourceManager(this.FALLBACK_VIDEO,
            // video sources are loaded asynchronously, and this little callback function
            // is called when the loading finishes to update the choices in the GUI dropdown
            (newSourceDictionary: { [key: string]: string }) => {
                this.videoSourceDropDown.options(newSourceDictionary);
            });

        // initialize the gui and add various controls
        this.gui = new GUI({ width: 300, closed: false });

        // create a dropdown list to select the video source; initially the only option is the
        // fallback video, more options are added when the VideoSourceManager is done loading
        const videoDeviceOptions: { [key: string]: string } = {};
        videoDeviceOptions[this.FALLBACK_VIDEO] = this.FALLBACK_VIDEO;
        this.videoSourceDropDown = this.gui.add(this.videoSourceManager, 'currentVideoSourceId', videoDeviceOptions);

        // this creates a checkbox for the debugging member variable
        const debuggingCheckbox = this.gui.add(this, 'debugging');

        // this creates a slider to set the value of the threshold member variable
        const thresholdSlider = this.gui.add(this, 'threshold', 0, 1);
    }

    // --- Initialize the Graphics Scene ---
    createScene(): void {
        // This parameter zooms in on the scene to fit within the window.
        // Other options include FIT or STRETCH.

        //this.renderer.viewport = gfx.Viewport.CROP;
        this.renderer.viewport = gfx.Viewport.FIT;

        // To see the texture to the scene, we need to apply it as a material to some geometry.
        // in this case, we'll create a big rectangle that fills the entire screen (width = 2, height = 2).
        this.backgroundRect = gfx.Geometry2Factory.createBox(2, 2);

        // Add all the objects to the scene--Order is important!
        // Objects that are added later will be rendered on top of objects that are added first.
        this.scene.add(this.backgroundRect);
        this.scene.add(this.raindropsParentNode);

    }


    // --- Update routine called once each frame by the main graphics loop ---
    update(deltaTime: number): void {
        const latestImage = this.videoSourceManager.currentVideoSource.getImageData();

        if (latestImage instanceof ImageData) {

            const width = latestImage.width;
            const height = latestImage.height;

            this.displayImage = ImageUtils.createOrResizeIfNeeded(this.displayImage, width, height);
            this.obstacleImage = ImageUtils.createOrResizeIfNeeded(this.obstacleImage, width, height);

            if (this.displayImage instanceof ImageData && this.obstacleImage instanceof ImageData) {

                // At this point, we know latestImage, this.displayImage, and this.obstacleImage are all
                // created and have the same width and height.  The pixels in latestImage will contain the
                // latest data from the camera and this.displayImage and this.obstacleImage are both
                // blank images (all pixels are black).

                //====================================================================================================
                //TODO: Part 2 Image Processing
                //Uncomment the following code and provide the appropriate parameters after completing the functions for Part 2
                ImageUtils.mirror(latestImage, this.displayImage);
                ImageUtils.convertToGrayscaleInPlace(this.displayImage);
                ImageUtils.threshold(this.displayImage, this.obstacleImage, this._threshold);

                //Remove the following line after completing Part 2
                //ImageUtils.copyPixels(latestImage, this.displayImage);
                //====================================================================================================

                // Texture the backgroundRect with either the displayImage or the obstacleImage
                if (this.backgroundRect instanceof gfx.Mesh2) {
                    let imageToDraw = this.displayImage;

                    if (this.debugging) {
                        imageToDraw = this.obstacleImage;
                    }

                    if (this.backgroundRect.material.texture == null ||
                        this.backgroundRect.material.texture.width != width ||
                        this.backgroundRect.material.texture.height != height) {
                        // We need to create a new texture and assign it to our backgroundRect
                        this.backgroundRect.material.texture = new gfx.Texture(imageToDraw);
                    } else {
                        // Otherwise, the appropriate texture already exists and we need to update its pixel array
                        this.backgroundRect.material.texture.setFullImageData(imageToDraw);
                    }
                }

                //====================================================================================================
                //TODO: Part 1.2 Raindrop Spawning
                //In order to prevent infinite raindrops, we will want to limit the total number of raindrops.
                //We may also want to wait a certain amount of time between spawning raindrops--remember that update runs every frame.

                if (this.raindropCount < 120) { // Limit number of raindrops in 120
                    const currentTime = Date.now(); // record real time

                    if ( currentTime - this.timeLastDrop >= 300) { // Wait for 0.3 s / 300 ms to spawn raindrops
                        this.spawnRaindrop();
                        this.timeLastDrop = currentTime; // Update time of last rainDrop
                    }
                    
                }
              
                //====================================================================================================
                
                
                //====================================================================================================
                //TODO: Part 1.3 Basic Rain Animation & Recycling
                //Iterate through each raindrop and position it according to its velocity and deltaTime assuming nothing is in its way
                //Then we should check if the raindrop has fallen off of the screen and needs to be removed or repositioned
                
                
                const raindropVelocity = new gfx.Vector2(0,-0.25); // Drop velocity
                // ADD YOUR CODE HERE
                for (let i = 0; i < this.raindropsParentNode.children.length; i++) { // Iterate through each raindrop and its position
                    const raindrop = this.raindropsParentNode.children[i] as gfx.Mesh2;
                    raindrop.position.y += raindropVelocity.y * deltaTime; // update position
        
                    // Repositioned/Remove the raindrop has fallen off when Y < -1.1
                    if (raindrop.position.y < -1.1) {
                        this.raindropsParentNode.removeChild(raindrop);
                        this.raindropCount -= 1;
                    }
                }
                
                //====================================================================================================


                //====================================================================================================
                let length = this.raindropsParentNode.children.length;
                let i = 0;
                while (i < length) { // Deal with each raindrop
                    const raindrop = this.raindropsParentNode.children[i] as gfx.Mesh2;
                    //TODO: Part 3.2 Convert Coordinates
                    //convert the raindrop's position to a col,row within the image using the appropriate functions

                    const drop_col = this.sceneXtoImageColumn(raindrop.position.x, this.displayImage.width);
                
                    let drop_row = this.sceneYtoImageRow(raindrop.position.y, this.displayImage.height);

                    //====================================================================================================


                    //====================================================================================================
                    //TODO: Part 3.3 Respond to Obstacles
                    // Iterate through each raindrop and check if it encounters an obstacle
                    // First, we need to make sure the raindrop is over the image (if not, we can assume it is off screen)
                    // Then, we need to check if the obstacleImage at the raindrop's position is a dark region 
                    //(the helper functions in Image Utils may be useful)
                    // If it is, we should keep the raindrop from falling any further

                    if (drop_col >= 0 && drop_col < this.obstacleImage.width && drop_row >= 0 &&  drop_row < this.obstacleImage.height){
                        const idx = ImageUtils.getRed(this.obstacleImage, drop_col, drop_row)
                        let check = this.obstacleImage.data[idx];
                        //====================================================================================================
                        //TODO: Part 3.3 Respond to Obstacles
                        // Iterate through each raindrop and check if it encounters an obstacle
                        // First, we need to make sure the raindrop is over the image (if not, we can assume it is off screen)
                        // Then, we need to check if the obstacleImage at the raindrop's position is a dark region 
                        //(the helper functions in Image Utils may be useful)
                        // If it is, we should keep the raindrop from falling any further
                        //====================================================================================================

                        // If check is 0, which means black and raindrop meets obstacles
                        while (check == 0) {
                            
                            //====================================================================================================
                            //TODO: Part 3.4 Advanced Response to Obstacles
                            // Extend or modify the logic from Part 3.3 to push the raindrop above dark regions
                            // Raindrops will need to move up and down as the video changes to respond to obstacles 

                            // Way 1: e move one pixel up
                            drop_row -= 1;
                            if (drop_row < 0 || drop_row >= this.obstacleImage.height){
                                //If raindrop is always going up and outside of displayscreen, we should remove it
                                raindrop.position.y = -1.2;
                                this.raindropsParentNode.removeChild(raindrop);
                                this.raindropCount -= 1;
                                //The length and index need to be updated by removing raindrop
                                i -= 1; 
                                length -= 1;
                                break;
                            }
                            raindrop.position.y = this.imageRowToSceneY(drop_row, this.obstacleImage.height); //  Update raindrop's position
            
                            //====================================================================================================
                            //TODO: Part 4.2 Advanced Obstacle Animation
                            // Add at least one animation to the raindrops, background image, or another object
                            // that occurs when the letters encounter obstacles

                            //====================================================================================================
                            // when raindrop hits obstacels, it will turn GREEN
                            raindrop.material.color = gfx.Color.PURPLE;
                            check = this.obstacleImage.data[ImageUtils.getRed(this.obstacleImage, drop_col, drop_row)]; //  Raindrops will need to move up until meet white area (check == 255)
                            // Always check until find white pixel
                            



                            // Way 2: change y position first


                            // raindrop.position.y -= raindropVelocity.y * deltaTime; //  Update raindrop's position
                            // if (raindrop.position.y >= 1|| raindrop.position.y <= -1){
                            //     //If raindrop is always going up and outside of displayscreen, we should remove it
                            //     this.raindropsParentNode.removeChild(raindrop);
                            //     this.raindropCount -= 1.2;
                            //     break;
                            // }
                            // // when raindrop hits obstacels, it will turn GREEN
                            // raindrop.material.color = gfx.Color.PURPLE;
                            // const new_row = this.sceneYtoImageRow(raindrop.position.y, this.obstacleImage.height);
                            // //  Raindrops will need to move up until meet white area (check == 255)
                            // const new_idx = ImageUtils.getRed(this.obstacleImage, drop_col, new_row);
                            // check = this.obstacleImage.data[new_idx]; //  Raindrops will need to move up until meet white area (check == 255)
                            
                        }              
                    }
                    i++; // index + 1
                }

            

            }
        }
    }

    // --- Additional Class Member Functions ---
 
    private spawnRaindrop(): void {
        //====================================================================================================

        //TODO: PART 1.1 Raindrop Creation
        //We should choose a random word from the wordList
        //For each letter in the word, we need to spawn a raindrop geometry on the appropriate node
        //At random locations along the X-axis and at the appropriate Y-axis position 
        //We need to apply a Text texture to the raindrop material using the current letter

        // ADD YOUR CODE HERE

        // // Get random index in the wordArray
        // const randomIndex = Math.floor(Math.random() * this.wordArray.length);
        // // Get random word
        // const randomWord = this.wordArray[randomIndex]
        // // Get array of letters in the random word
        // const letters = randomWord.split('');

        // Operate each letter to make rainDrop
        // letters.forEach(letter => {
        //     // Apply a Text texture to the raindrop material using the current letter
        //     this.raindrop = gfx.Geometry2Factory.createBox(1, 1);
        //     this.raindrop.material.texture = new gfx.Text(letter,400, 400, '24px monospace', gfx.Color.BLUE);

        //     // Set each letter initial position with random X value and appropriate Y value
        //     const x_random = Math.random()*2-1;
        //     this.raindrop.position = new gfx.Vector2(x_random, 1.1);
            
        //     this.raindropCount += 1; // Update count of rainDrop
        //     this.raindropsParentNode.add(this.raindrop); // add spawned raindrop to array

        //     this.scene.add(this.raindrop);




        // Part 4.1, Select words from wordArray2, part 1 for selecting letter is above

        // Get random index in the wordArray
        const randomIndex = Math.floor(Math.random() * this.wordArray.length);
        const word = this.wordArray2[randomIndex];
        const letters = word.split('');

        // Operate each letter to make rainDrop
        letters.forEach(letter => {

            // Apply a Text texture to the raindrop material using the current letter
            this.raindrop = gfx.Geometry2Factory.createBox(1, 1);
            //Set the text color to Blue before meeeting obstacles
            this.raindrop.material.color = gfx.Color.BLUE
            this.raindrop.material.texture = new gfx.Text(letter, 400, 400, '24px monospace', gfx.Color.WHITE);

            // Set each letter initial position with random X value and appropriate Y value
            const x_random = Math.random()*2-1;
            this.raindrop.position = new gfx.Vector2(x_random, 1.1);
            
            this.raindropCount += 1; // Update count of rainDrop
            this.raindropsParentNode.add(this.raindrop); // add spawned raindrop to array

            this.scene.add(this.raindrop);

        });
        

        //====================================================================================================
    }

    //====================================================================================================
    //TODO: Part 3.1 Scene <-> Image Coordinate Conversion
    //Complete the following four functions to convert between scene coordinates and image coordinates
    sceneXtoImageColumn(x: number, imageWidth: number) : number {
        return Math.round((x + 1) * 0.5 * imageWidth);
    }

    sceneYtoImageRow(y: number, imageHeight: number): number  {
        return Math.round((1 - y) * 0.5 * imageHeight);
    }

    imageColumnToSceneX(col: number, imageWidth: number): number  {
        return (2 * col / imageWidth) - 1; // Convert from sceneXtoImageColumn
    }

    imageRowToSceneY(row: number, imageHeight: number): number  {
        return 1 - (2 * row / imageHeight); // Convert from sceneYtoImageRow
    }
    //====================================================================================================
}