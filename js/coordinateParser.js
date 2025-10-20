/**
 * Coordinate parsing utilities
 * Handles parsing of coordinates from API responses
 */

export class CoordinateParser {
    constructor(tokenValue = 1000) {
        this.tokenValue = tokenValue;
    }

    /**
     * Parse coordinates from API response text
     * @param {string} responseText - The response text containing coordinates
     * @returns {Array} Array of normalized coordinate objects
     */
    parseCoordinates(responseText) {
        try {
            // Extract coordinates from the response text
            const coordinateMatch = responseText.match(/<\|box_start\|>(.*?)<\|box_end\|>/);
            if (coordinateMatch) {
                const coordinateString = coordinateMatch[1];
                
                // Split by comma and parse each coordinate pair
                const coordinates = coordinateString.split(",").map(coord => {
                    const cleanCoord = coord.trim();
                    // Handle different coordinate formats: "x,y" or "<x><y>"
                    let x, y;
                    if (cleanCoord.includes("><")) {
                        const parts = cleanCoord.split("><");
                        x = Number(parts[0].replace(/[<>]/g, ""));
                        y = Number(parts[1].replace(/[<>]/g, ""));
                    } else {
                        const parts = cleanCoord.split(",");
                        x = Number(parts[0]);
                        y = Number(parts[1]);
                    }
                    
                    // Convert normalized coordinates (0-tokenValue) to pixel coordinates
                    // Assuming coordinates are normalized by tokenValue
                    const normalizedX = x / this.tokenValue;
                    const normalizedY = y / this.tokenValue;
                    
                    return { 
                        x: normalizedX, 
                        y: normalizedY,
                        originalX: x,
                        originalY: y
                    };
                }).filter(coord => !isNaN(coord.x) && !isNaN(coord.y) && coord.x >= 0 && coord.x <= 1 && coord.y >= 0 && coord.y <= 1);
                
                console.log("Parsed normalized coordinates:", coordinates);
                return coordinates;
            }
        } catch (error) {
            console.error("Error parsing coordinates:", error);
        }
        return [];
    }

    /**
     * Convert normalized coordinates to pixel coordinates
     * @param {Array} coordinates - Array of normalized coordinates
     * @param {number} imageWidth - Image width in pixels
     * @param {number} imageHeight - Image height in pixels
     * @returns {Array} Array of pixel coordinate objects
     */
    convertToPixelCoordinates(coordinates, imageWidth, imageHeight) {
        return coordinates.map(coord => ({
            x: coord.x * imageWidth,
            y: coord.y * imageHeight,
            originalX: coord.originalX,
            originalY: coord.originalY
        }));
    }

    /**
     * Validate coordinates are within image bounds
     * @param {Array} coordinates - Array of pixel coordinates
     * @param {number} imageWidth - Image width in pixels
     * @param {number} imageHeight - Image height in pixels
     * @returns {Array} Array of valid coordinates
     */
    validateCoordinates(coordinates, imageWidth, imageHeight) {
        return coordinates.filter(coord => 
            coord.x >= 0 && coord.x <= imageWidth && 
            coord.y >= 0 && coord.y <= imageHeight
        );
    }
}
