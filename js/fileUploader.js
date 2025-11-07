/**
 * File upload utilities
 * Handles file upload functionality
 */

import { ImageTagger } from "./imageTagger.js";

export class FileUploader {
    constructor(fileInputId, uploadStatusId) {
        this.fileInput = document.getElementById(fileInputId);
        this.uploadStatus = document.getElementById(uploadStatusId);
        this.selectedFile = null;
        this.imageUrl = "";
        this.imageTagger = new ImageTagger();
        this.onTagsReceived = null; // Callback for when tags are received
    }

    /**
     * Initialize file input event listener
     * @param {Function} onFileSelected - Callback when file is selected
     */
    init(onFileSelected) {
        this.fileInput.addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (file) {
                this.selectedFile = file;
                if (onFileSelected) {
                    await onFileSelected(file);
                }
                await this.uploadFile();
                // Automatically get tags after successful upload
                if (this.imageUrl) {
                    await this.getTagsForImage();
                }
            }
        });
    }

    /**
     * Upload file to server
     */
    async uploadFile() {
        if (!this.selectedFile) {
            this.uploadStatus.textContent = "Please upload an image first.";
            return;
        }

        this.uploadStatus.textContent = "Uploading...";

        const formData = new FormData();
        formData.append("file", this.selectedFile);

        try {
            const response = await fetch("/upload", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                this.uploadStatus.textContent = "Upload successful!";
                this.imageUrl = data.imageUrl;
            } else {
                this.uploadStatus.textContent = "Upload failed. Please try again.";
                this.imageUrl = "";
            }
        } catch (error) {
            this.uploadStatus.textContent = "Error uploading file.";
            console.error("Upload error:", error);
        }
    }

    /**
     * Get the current image URL
     * @returns {string} The image URL
     */
    getImageUrl() {
        return this.imageUrl;
    }

    /**
     * Get the selected file
     * @returns {File|null} The selected file
     */
    getSelectedFile() {
        return this.selectedFile;
    }

    /**
     * Check if a file is uploaded
     * @returns {boolean} True if file is uploaded
     */
    hasFile() {
        return !!this.imageUrl;
    }

    /**
     * Get tags for the current image
     */
    async getTagsForImage() {
        if (!this.imageUrl) {
            console.warn("No image URL available for tagging");
            return [];
        }

        this.uploadStatus.textContent = "Getting tags...";
        const tags = await this.imageTagger.getTags(this.imageUrl);
        
        if (tags.length > 0) {
            this.uploadStatus.textContent = `Upload successful! Found ${tags.length} tags.`;
            // Call callback if set
            if (this.onTagsReceived) {
                this.onTagsReceived(tags);
            }
        } else {
            this.uploadStatus.textContent = "Upload successful! No tags found.";
        }
        
        return tags;
    }

    /**
     * Set callback for when tags are received
     * @param {Function} callback - Callback function
     */
    setOnTagsReceived(callback) {
        this.onTagsReceived = callback;
    }

    /**
     * Get current tags
     * @returns {Array} Current tags
     */
    getCurrentTags() {
        return this.imageTagger.getCurrentTags();
    }
}
