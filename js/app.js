/**
 * Main application module
 * Coordinates all other modules and handles the main application logic
 */

import { CoordinateParser } from "./coordinateParser.js";
import { CanvasDrawer } from "./canvasDrawer.js";
import { FileUploader } from "./fileUploader.js";
import { TagButtonManager } from "./tagButtonManager.js";

export class GradioApp {
    constructor() {
        this.coordinateParser = new CoordinateParser(1000);
        this.canvasDrawer = new CanvasDrawer("numberingCanvas", "pointsImage");
        this.fileUploader = new FileUploader("fileInput", "uploadStatus");
        this.tagButtonManager = new TagButtonManager();
        
        this.imagePreview = document.getElementById("imagePreview");
        this.predictButton = document.getElementById("predictButton");
        this.resultDisplay = document.getElementById("result");
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupFileUpload();
        this.setupPredictionButton();
        this.setupTagButtons();
    }

    /**
     * Setup file upload functionality
     */
    setupFileUpload() {
        this.fileUploader.init(async (file) => {
            // Show image preview when file is selected
            const reader = new FileReader();
            reader.onload = (e) => {
                this.imagePreview.src = e.target.result;
                this.imagePreview.style.display = "block";
            };
            reader.readAsDataURL(file);
        });

        // Set up callback for when tags are received
        this.fileUploader.setOnTagsReceived((tags) => {
            this.handleTagsReceived(tags);
        });
    }

    /**
     * Setup prediction button functionality
     */
    setupPredictionButton() {
        this.predictButton.addEventListener("click", async () => {
            await this.runPrediction();
        });
    }

    /**
     * Setup tag button functionality
     */
    setupTagButtons() {
        // Initialize tag button manager
        this.tagButtonManager.init("tagButtons", "categoriesInput");

        // Setup select all button
        const selectAllBtn = document.getElementById("selectAllTags");
        if (selectAllBtn) {
            selectAllBtn.addEventListener("click", () => {
                this.tagButtonManager.selectAllTags();
            });
        }

        // Setup deselect all button
        const deselectAllBtn = document.getElementById("deselectAllTags");
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener("click", () => {
                this.tagButtonManager.deselectAllTags();
            });
        }
    }

    /**
     * Run prediction with uploaded image and categories
     */
    async runPrediction() {
        const categoriesInput = document.getElementById("categoriesInput").value;
        
        if (!this.fileUploader.hasFile()) {
            this.resultDisplay.textContent = "Please upload an image first.";
            return;
        }
        
        if (!categoriesInput) {
            this.resultDisplay.textContent = "Please input categories first.";
            return;
        }

        this.resultDisplay.textContent = "Predicting...";
        
        try {
            const imageUrl = this.fileUploader.getImageUrl();
            const response_0 = await fetch(imageUrl);
            
            const response = await fetch("/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl, categories: categoriesInput }),
            });

            if (response.ok) {
                const result = await response.json();
                this.resultDisplay.textContent = JSON.stringify(result, null, 2);
                this.handlePredictionResult(result, imageUrl);
            } else {
                this.resultDisplay.textContent = "Prediction failed. Please try again.";
            }
        } catch (error) {
            console.error("Prediction error:", error);
            this.resultDisplay.textContent = "Error during prediction.";
        }
    }

    /**
     * Handle prediction result and draw coordinates
     * @param {Object} result - The prediction result
     * @param {string} imageUrl - The image URL
     */
    handlePredictionResult(result, imageUrl) {
        // Parse the response to extract image and coordinates
        if (result.data && result.data.length > 0) {
            const imageData = result.data[0];
            const coordinatesText = result.data[1];

            if (imageData.url) {
                // Try to parse coordinates from the response
                const coordinates = this.coordinateParser.parseCoordinates(coordinatesText);
                console.log("coordinates", coordinates);
                
                if (coordinates.length > 0) {
                    // Draw custom numbers on the original image
                    this.canvasDrawer.drawNumbersOnImage(imageUrl, coordinates);
                } else {
                    // Fallback: show API generated image if available
                    this.canvasDrawer.showPointsImage(imageData.url);
                }
            }
        }
    }

    /**
     * Handle tags received from tagger
     * @param {Array} tags - Array of tags
     */
    handleTagsReceived(tags) {
        console.log("Tags received:", tags);
        
        // Display tags in the tags display area
        this.displayTags(tags);
        
        // Create tag buttons (initially no tags selected)
        this.tagButtonManager.createTagButtons(tags);
        
        // Clear the input field initially (as requested)
        const categoriesInput = document.getElementById("categoriesInput");
        if (categoriesInput) {
            categoriesInput.value = "";
            categoriesInput.placeholder = "please input you want to count";
        }
    }

    /**
     * Display tags in the UI
     * @param {Array} tags - Array of tags to display
     */
    displayTags(tags) {
        const tagsDisplay = document.getElementById("tagsDisplay");
        const tagsList = document.getElementById("tagsList");
        
        if (tagsDisplay && tagsList) {
            if (tags && tags.length > 0) {
                tagsList.textContent = tags.join(", ");
                tagsDisplay.style.display = "block";
            } else {
                tagsDisplay.style.display = "none";
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    new GradioApp();
});
