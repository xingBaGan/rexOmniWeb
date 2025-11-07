// Coordinate parsing utilities
// Handles parsing of coordinates from API responses

interface ParsedCoordinate {
  x: number;
  y: number;
  label: string;
  groupIndex: number;
  coordIndex: number;
}

interface ObjectGroup {
  label: string;
  coordinates: Array<{ x: number; y: number; originalX: number; originalY: number }>;
}

const TOKEN_VALUE = 1000;

/**
 * Parse coordinates from API response text
 */
export const parseCoordinates = (responseText: string): ParsedCoordinate[] => {
  try {
    const groups = parseObjectGroups(responseText);
    const allCoordinates: ParsedCoordinate[] = [];
    
    groups.forEach((group, groupIndex) => {
      group.coordinates.forEach((coord, coordIndex) => {
        allCoordinates.push({
          x: coord.x,
          y: coord.y,
          label: group.label,
          groupIndex: groupIndex,
          coordIndex: coordIndex,
        });
      });
    });
    
    return allCoordinates;
  } catch (error) {
    console.error("Error parsing coordinates:", error);
    return [];
  }
};

/**
 * Parse multiple object groups from response text
 */
const parseObjectGroups = (responseText: string): ObjectGroup[] => {
  const groups: ObjectGroup[] = [];
  
  // Match pattern: <|object_ref_start|>LABEL<|object_ref_end|><|box_start|>COORDINATES<|box_end|>
  const groupPattern = /<\|object_ref_start\|>(.*?)<\|object_ref_end\|>\s*<\|box_start\|>(.*?)<\|box_end\|>/g;
  let match;
  
  while ((match = groupPattern.exec(responseText)) !== null) {
    const label = match[1].trim();
    const coordinateString = match[2].trim();
    
    const coordinates = parseCoordinateString(coordinateString);
    
    if (coordinates.length > 0) {
      groups.push({
        label: label,
        coordinates: coordinates,
      });
    }
  }
  
  return groups;
};

/**
 * Parse coordinate string into array of coordinate objects
 */
const parseCoordinateString = (coordinateString: string) => {
  return coordinateString.split(",").map((coord) => {
    const cleanCoord = coord.trim();
    let x: number, y: number;
    
    if (cleanCoord.includes("><")) {
      const parts = cleanCoord.split("><");
      x = Number(parts[0].replace(/[<>]/g, ""));
      y = Number(parts[1].replace(/[<>]/g, ""));
    } else {
      const parts = cleanCoord.split(",");
      x = Number(parts[0]);
      y = Number(parts[1]);
    }
    
    // Convert normalized coordinates (0-tokenValue) to percentage (0-100)
    const normalizedX = (x / TOKEN_VALUE) * 100;
    const normalizedY = (y / TOKEN_VALUE) * 100;
    
    return { 
      x: normalizedX, 
      y: normalizedY,
      originalX: x,
      originalY: y,
    };
  }).filter((coord) => 
    !isNaN(coord.x) && 
    !isNaN(coord.y) && 
    coord.x >= 0 && 
    coord.x <= 100 && 
    coord.y >= 0 && 
    coord.y <= 100
  );
};

