/**
 * Canvas drawing utilities
 * Handles drawing numbers and points on canvas
 */

export class CanvasDrawer {
    constructor(canvasId, pointsImageId) {
        this.canvas = document.getElementById(canvasId);
        this.pointsImage = document.getElementById(pointsImageId);
        this.ctx = this.canvas.getContext("2d");
    }

    /**
     * Draw numbers on image with coordinates
     * @param {string} imageSrc - Source URL of the image
     * @param {Array} coordinates - Array of normalized coordinates
     */
    drawNumbersOnImage(imageSrc, coordinates) {
        // Validate inputs
        if (!imageSrc || !coordinates || coordinates.length === 0) {
            console.error("Invalid image source or coordinates");
            return;
        }

        const img = new Image();
        img.onload = () => {
            try {
                this._setupCanvas(img);
                this._drawImage(img);
                this._drawNumbers(coordinates, img.width, img.height);
                this._showCanvas();
            } catch (error) {
                console.error("Error drawing numbers on image:", error);
            }
        };

        img.onerror = () => {
            console.error("Failed to load image:", imageSrc);
        };

        img.src = imageSrc;
    }

    /**
     * Setup canvas dimensions and scaling
     * @private
     */
    _setupCanvas(img) {
        // Get the container dimensions to calculate scaling
        const container = document.getElementById("rightImageContainer");
        let containerWidth = container.clientWidth;
        let containerHeight = container.clientHeight;
        
        // If container dimensions are zero, use fallback or wait
        if (containerWidth === 0 || containerHeight === 0) {
            // Use image dimensions as fallback
            containerWidth = img.width;
            containerHeight = img.height;
            console.warn("Container dimensions are zero, using image dimensions as fallback");
        }
        
        // Calculate scaling factors
        const scaleX = containerWidth / img.width;
        const scaleY = containerHeight / img.height;
        const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio
        
        // Set canvas display size (CSS) - use 100% width if container is available
        if (container.clientWidth > 0) {
            this.canvas.style.width = "100%";
            this.canvas.style.height = "auto";
        } else {
            this.canvas.style.width = (img.width * scale) + "px";
            this.canvas.style.height = (img.height * scale) + "px";
        }
        
        // Set canvas internal size (actual pixels)
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        console.log("Image dimensions:", img.width, img.height);
        console.log("Container dimensions:", containerWidth, containerHeight);
        console.log("Canvas display size:", this.canvas.style.width, this.canvas.style.height);
        console.log("Canvas internal size:", this.canvas.width, this.canvas.height);
        console.log("Scale factor:", scale);
    }

    /**
     * Draw the original image on canvas
     * @private
     */
    _drawImage(img) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw the original image
        this.ctx.drawImage(img, 0, 0);
    }

    /**
     * Draw numbers at coordinate positions
     * @private
     */
    _drawNumbers(coordinates, imageWidth, imageHeight) {
        // Convert normalized coordinates to pixel coordinates
        const pixelCoordinates = coordinates.map(coord => ({
            x: coord.x * imageWidth,
            y: coord.y * imageHeight,
            originalX: coord.originalX,
            originalY: coord.originalY
        }));

        // Validate coordinates are within image bounds
        const validCoordinates = pixelCoordinates.filter(coord => 
            coord.x >= 0 && coord.x <= imageWidth && 
            coord.y >= 0 && coord.y <= imageHeight
        );

        if (validCoordinates.length === 0) {
            console.warn("No valid coordinates found within image bounds");
            return;
        }

        // Set drawing styles
        this.ctx.font = "bold 24px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        
        console.log("Pixel coordinates:", validCoordinates);
        
        validCoordinates.forEach((coord, index) => {
            this._drawNumber(coord, index + 1);
        });
    }

    /**
     * Draw a single number at a coordinate
     * @private
     */
    _drawNumber(coord, number) {
        const numberStr = number.toString();

        // Draw a white circle background
        this.ctx.beginPath();
        this.ctx.arc(coord.x, coord.y, 20, 0, 2 * Math.PI);
        this.ctx.fillStyle = "white";
        this.ctx.fill();
        
        // Draw red border
        this.ctx.strokeStyle = "#ff0000";
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Draw the number
        this.ctx.fillStyle = "#ff0000";
        this.ctx.fillText(numberStr, coord.x, coord.y);
    }

    /**
     * Show canvas and hide points image
     * @private
     */
    _showCanvas() {
        this.canvas.style.display = "block";
        this.pointsImage.style.display = "none";
    }

    /**
     * Show points image and hide canvas
     */
    showPointsImage(imageSrc) {
        this.pointsImage.src = imageSrc;
        this.pointsImage.style.display = "block";
        this.canvas.style.display = "none";
    }
}
