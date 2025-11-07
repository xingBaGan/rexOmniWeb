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
     * @returns {Array} Array of coordinate objects with labels
     */
    parseCoordinates(responseText) {
        try {
            // Parse multiple object groups
            const groups = this.parseObjectGroups(responseText);
            
            // Flatten all coordinates from all groups
            const allCoordinates = [];
            groups.forEach((group, groupIndex) => {
                group.coordinates.forEach((coord, coordIndex) => {
                    allCoordinates.push({
                        ...coord,
                        label: group.label,
                        groupIndex: groupIndex,
                        coordIndex: coordIndex
                    });
                });
            });
            
            console.log("Parsed object groups:", groups);
            console.log("All coordinates:", allCoordinates);
            return allCoordinates;
        } catch (error) {
            console.error("Error parsing coordinates:", error);
        }
        return [];
    }

    /**
     * Parse multiple object groups from response text
     * @param {string} responseText - The response text containing multiple object groups
     * @returns {Array} Array of object groups with labels and coordinates
     */
    parseObjectGroups(responseText) {
        const groups = [];
        
        // Match pattern: <|object_ref_start|>LABEL<|object_ref_end|><|box_start|>COORDINATES<|box_end|>
        const groupPattern = /<\|object_ref_start\|>(.*?)<\|object_ref_end\|>\s*<\|box_start\|>(.*?)<\|box_end\|>/g;
        let match;
        
        while ((match = groupPattern.exec(responseText)) !== null) {
            const label = match[1].trim();
            const coordinateString = match[2].trim();
            
            // Parse coordinates for this group
            const coordinates = this.parseCoordinateString(coordinateString);
            
            if (coordinates.length > 0) {
                groups.push({
                    label: label,
                    coordinates: coordinates
                });
            }
        }
        
        return groups;
    }

    /**
     * Parse coordinate string into array of coordinate objects
     * @param {string} coordinateString - String containing coordinates like "<99><685>,<229><645>"
     * @returns {Array} Array of normalized coordinate objects
     */
    parseCoordinateString(coordinateString) {
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
        
        return coordinates;
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
