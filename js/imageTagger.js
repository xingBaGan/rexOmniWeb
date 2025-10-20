/**
 * Image tagger utilities
 * Handles image tagging functionality
 */

export class ImageTagger {
    constructor() {
        this.tags = [];
        this.isLoading = false;
    }

    /**
     * Get tags for an image
     * @param {string} imageUrl - URL of the image to tag
     * @returns {Promise<Array>} Array of tags
     */
    async getTags(imageUrl) {
        if (!imageUrl) {
            console.error("No image URL provided");
            return [];
        }

        this.isLoading = true;
        
        try {
            const response = await fetch("/tagger", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl }),
            });

            if (response.ok) {
                const result = await response.json();
                this.tags = this.parseTags(result);
                console.log("Tags received:", this.tags);
                return this.tags;
            } else {
                console.error("Failed to get tags:", response.status);
                return [];
            }
        } catch (error) {
            console.error("Error getting tags:", error);
            return [];
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Parse tags from API response
     * @param {Object} result - API response
     * @returns {Array} Array of parsed tags
     */
    parseTags(result) {
        try {
            // Handle new Gemini API response format
            if (result.success && Array.isArray(result.tags)) {
                return result.tags.map(tag => {
                    if (typeof tag === "string") {
                        return tag.trim();
                    }
                    return String(tag).trim();
                }).filter(tag => tag && tag.length > 0);
            }
            
            // Fallback: try to extract from raw response
            if (result.rawResponse) {
                try {
                    const cleanText = result.rawResponse.replace(/```json\n?|\n?```/g, '').trim();
                    const parsed = JSON.parse(cleanText);
                    if (Array.isArray(parsed)) {
                        return parsed.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
                    }
                } catch (parseError) {
                    // Try regex extraction as last resort
                    const match = result.rawResponse.match(/\[(.*?)\]/);
                    if (match) {
                        return match[1].split(',').map(tag => tag.trim().replace(/"/g, '')).filter(tag => tag.length > 0);
                    }
                }
            }
            
            // Legacy format support
            if (result.data && Array.isArray(result.data)) {
                return result.data.map(tag => {
                    if (typeof tag === "string") {
                        return tag.trim();
                    } else if (tag && typeof tag === "object") {
                        return tag.name || tag.label || tag.text || String(tag);
                    }
                    return String(tag);
                }).filter(tag => tag && tag.length > 0);
            }
            
            // Fallback: try to extract from text response
            if (result.text) {
                return result.text.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
            
            return [];
        } catch (error) {
            console.error("Error parsing tags:", error);
            return [];
        }
    }

    /**
     * Get current tags
     * @returns {Array} Current tags
     */
    getCurrentTags() {
        return this.tags;
    }

    /**
     * Check if currently loading
     * @returns {boolean} Loading state
     */
    isLoading() {
        return this.isLoading;
    }

    /**
     * Clear current tags
     */
    clearTags() {
        this.tags = [];
    }

    /**
     * Format tags for display
     * @param {Array} tags - Tags to format
     * @returns {string} Formatted tags string
     */
    formatTagsForDisplay(tags) {
        if (!tags || tags.length === 0) {
            return "No tags found";
        }
        return tags.join(", ");
    }

    /**
     * Format tags for input field
     * @param {Array} tags - Tags to format
     * @returns {string} Formatted tags string for input
     */
    formatTagsForInput(tags) {
        if (!tags || tags.length === 0) {
            return "";
        }
        return tags.join(", ");
    }
}
