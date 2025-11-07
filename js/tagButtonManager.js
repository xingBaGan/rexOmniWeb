/**
 * Tag button manager
 * Handles tag button creation, selection, and input field management
 */

export class TagButtonManager {
    constructor() {
        this.selectedTags = new Set();
        this.tagButtons = new Map();
        this.categoriesInput = null;
        this.tagsContainer = null;
    }

    /**
     * Initialize the tag button manager
     * @param {string} tagsContainerId - ID of the container for tag buttons
     * @param {string} categoriesInputId - ID of the categories input field
     */
    init(tagsContainerId, categoriesInputId) {
        this.tagsContainer = document.getElementById(tagsContainerId);
        this.categoriesInput = document.getElementById(categoriesInputId);
        
        if (!this.tagsContainer || !this.categoriesInput) {
            console.error("Tag container or categories input not found");
            return;
        }
    }

    /**
     * Create tag buttons from tags array
     * @param {Array} tags - Array of tag strings
     */
    createTagButtons(tags) {
        if (!this.tagsContainer) {
            console.error("Tags container not initialized");
            return;
        }

        // Clear existing buttons
        this.clearTagButtons();

        if (!tags || tags.length === 0) {
            this.tagsContainer.innerHTML = "<div style='color: #999; font-style: italic;'>No tags detected</div>";
            return;
        }

        // Create buttons for each tag
        tags.forEach(tag => {
            const button = this.createTagButton(tag);
            this.tagsContainer.appendChild(button);
            this.tagButtons.set(tag, button);
        });
    }

    /**
     * Create a single tag button
     * @param {string} tag - Tag text
     * @returns {HTMLElement} Button element
     */
    createTagButton(tag) {
        const button = document.createElement("button");
        button.textContent = tag;
        button.className = "tag-button";
        button.style.cssText = `
            margin: 4px;
            padding: 6px 12px;
            border: 2px solid #ddd;
            border-radius: 20px;
            background-color: #f8f9fa;
            color: #495057;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
            outline: none;
        `;

        // Add hover effects
        button.addEventListener("mouseenter", () => {
            if (!this.selectedTags.has(tag)) {
                button.style.backgroundColor = "#e9ecef";
                button.style.borderColor = "#adb5bd";
            }
        });

        button.addEventListener("mouseleave", () => {
            if (!this.selectedTags.has(tag)) {
                button.style.backgroundColor = "#f8f9fa";
                button.style.borderColor = "#ddd";
            }
        });

        // Add click handler
        button.addEventListener("click", () => {
            this.toggleTagSelection(tag);
        });

        return button;
    }

    /**
     * Toggle tag selection
     * @param {string} tag - Tag to toggle
     */
    toggleTagSelection(tag) {
        const button = this.tagButtons.get(tag);
        if (!button) return;

        if (this.selectedTags.has(tag)) {
            // Deselect tag
            this.selectedTags.delete(tag);
            this.updateButtonStyle(button, false);
        } else {
            // Select tag
            this.selectedTags.add(tag);
            this.updateButtonStyle(button, true);
        }

        // Update input field
        this.updateInputField();
    }

    /**
     * Update button visual style
     * @param {HTMLElement} button - Button element
     * @param {boolean} selected - Whether button is selected
     */
    updateButtonStyle(button, selected) {
        if (selected) {
            button.style.backgroundColor = "#007bff";
            button.style.borderColor = "#007bff";
            button.style.color = "#ffffff";
        } else {
            button.style.backgroundColor = "#f8f9fa";
            button.style.borderColor = "#ddd";
            button.style.color = "#495057";
        }
    }

    /**
     * Update the categories input field with selected tags
     */
    updateInputField() {
        if (!this.categoriesInput) return;

        const selectedTagsArray = Array.from(this.selectedTags);
        this.categoriesInput.value = selectedTagsArray.join(", ");
        
        // Update placeholder
        if (selectedTagsArray.length > 0) {
            this.categoriesInput.placeholder = `Selected: ${selectedTagsArray.join(", ")}`;
        } else {
            this.categoriesInput.placeholder = "please input you want to count";
        }
    }

    /**
     * Clear all tag buttons
     */
    clearTagButtons() {
        if (this.tagsContainer) {
            this.tagsContainer.innerHTML = "";
        }
        this.tagButtons.clear();
        this.selectedTags.clear();
        this.updateInputField();
    }

    /**
     * Get currently selected tags
     * @returns {Array} Array of selected tags
     */
    getSelectedTags() {
        return Array.from(this.selectedTags);
    }

    /**
     * Set selected tags programmatically
     * @param {Array} tags - Array of tags to select
     */
    setSelectedTags(tags) {
        this.selectedTags.clear();
        
        if (tags && Array.isArray(tags)) {
            tags.forEach(tag => {
                this.selectedTags.add(tag);
                const button = this.tagButtons.get(tag);
                if (button) {
                    this.updateButtonStyle(button, true);
                }
            });
        }
        
        this.updateInputField();
    }

    /**
     * Select all tags
     */
    selectAllTags() {
        this.tagButtons.forEach((button, tag) => {
            this.selectedTags.add(tag);
            this.updateButtonStyle(button, true);
        });
        this.updateInputField();
    }

    /**
     * Deselect all tags
     */
    deselectAllTags() {
        this.tagButtons.forEach((button, tag) => {
            this.selectedTags.delete(tag);
            this.updateButtonStyle(button, false);
        });
        this.updateInputField();
    }
}
