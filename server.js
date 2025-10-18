const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Client } = require("@gradio/client");

const app = express();
const upload = multer({ dest: 'uploads/' });

// Serve static files from the rexWEB directory
app.use(express.static(path.join(__dirname)));
// Load environment variables
require('dotenv').config();

// R2 details
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const baseURL = process.env.BASE_URL;
// Initialize S3 Client
const S3 = new S3Client({
    // Cloudflare R2 requires the endpoint to include the hostname
    endpoint: R2_ENDPOINT,
    region: 'auto', // R2 requires 'auto'
    credentials: {
        accessKeyId: R2_ACCESS_KEY,
        secretAccessKey: R2_SECRET_KEY,
    },
});
// Endpoint to handle file upload to Cloudflare R2
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileStream = fs.createReadStream(req.file.path);
    const fileName = req.file.originalname; // Use the original filename as the Key

    const uploadParams = {
        Bucket: R2_BUCKET,
        Key: fileName, // The name the file will have in R2
        Body: fileStream,
        ContentType: req.file.mimetype, // Set the correct MIME type
    };

    try {
        const command = new PutObjectCommand(uploadParams);
        await S3.send(command);

        // Clean up the local file after successful upload
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting local file:', err);
        });

        const imageUrl = `${baseURL}/${fileName}`;
        res.status(200).json({ message: 'Upload successful!', fileKey: fileName, imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up the local file on error as well
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting local file on error:', err);
        });
        res.status(500).json({ error: 'Error uploading file to R2' });
    }
});
const backendUrl = process.env.BACKEND_URL;
// Endpoint to handle prediction
app.post('/predict', express.json(), async (req, res) => {
    const { imageUrl, categories } = req.body;

    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const fetchedImage = await response.blob();

        const app = await Client.connect(backendUrl);
        const result = await app.predict(
            "/run_inference_wrapper",
            {
                input_image: fetchedImage,
                visual_prompter_data: null,
                task_selection: "Pointing",
                categories: categories,
                keypoint_type: "person",
                ocr_output_format: "Box",
                ocr_granularity: "Word Level",
                font_size: 20,
                draw_width: 5,
                show_labels: true,
                custom_color: "",
            }
        );
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Error during prediction' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});