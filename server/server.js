const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
// Dynamic import for ES Module
let Client;
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Database and authentication
const connectDB = require('./config/database');
const { findOrCreateUser, findUserByClerkId, updateSubscription, updateDailyCount, getDailyCount } = require('./models/user');
const { authenticate } = require('./middleware/auth');
const { createCheckoutSession, getSubscription, cancelSubscription } = require('./services/payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));
// Enable CORS for count app
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// JSON body parser
app.use(express.json());
// Load environment variables
require('dotenv').config();

// Connect to MongoDB
connectDB();
const requiredEnvVars = [
    "GOOGLE_AI_STUDIO_TOKEN",
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_GATEWAY_ID",
    "BACKEND_URL",
];
const missingEnvVars = requiredEnvVars.filter(
    (name) => !process.env[name] || process.env[name].trim() === "",
);
if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing environment variables: ${missingEnvVars.join(
            ", ",
        )}. Set them in a .env file or your shell environment.`,
    );
}
// R2 details
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY;
const baseURL = process.env.BASE_URL;
const api_token = process.env.GOOGLE_AI_STUDIO_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const gatewayId = process.env.CLOUDFLARE_GATEWAY_ID;

const label_prompt = `
 You are a helpful assistant that labels the objects in an image.
 Please label the objects in the image.
 Each distinct state of an object counts as a different label. 
 Tags with repeated semantics need to be omitted.
 Output labels should be simple and general, ideally no more than three words [countable nouns are required]. 
 No need to include objects in the foreground or background. 
 Output only a JSON array of strings, for example: [\"open box\",\"closed box\",\"door\",\"dog\"]. 
 Do not include any other text or descriptions.
 Please output the labels in the following format: [\"label1\",\"label2\",\"label3\"].`;
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

// Validate backend URL format
if (backendUrl && !backendUrl.startsWith('http')) {
    console.warn('Warning: BACKEND_URL should start with http:// or https://');
}

// Health check endpoint for backend connectivity
app.get('/health', async (req, res) => {
    if (!backendUrl) {
        return res.status(503).json({ 
            status: 'unhealthy', 
            error: 'Backend URL not configured' 
        });
    }
    
    try {
        // Dynamic import for ES Module
        if (!Client) {
            const { Client: GradioClient } = await import("@gradio/client");
            Client = GradioClient;
        }
        
        const app = await Client.connect(backendUrl);
        res.status(200).json({ 
            status: 'healthy', 
            backendUrl: backendUrl,
            message: 'Backend is accessible'
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({ 
            status: 'unhealthy', 
            backendUrl: backendUrl,
            error: error.message,
            details: 'Backend service is not accessible'
        });
    }
});

// Endpoint to handle prediction
app.post('/predict', express.json(), async (req, res) => {
    const { imageUrl, categories } = req.body;

    try {
        // Validate required fields
        if (!imageUrl) {
            return res.status(400).json({ error: 'imageUrl is required' });
        }
        
        if (!backendUrl) {
            return res.status(500).json({ error: 'Backend URL not configured' });
        }

        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const fetchedImage = await response.blob();

        // Dynamic import for ES Module
        if (!Client) {
            const { Client: GradioClient } = await import("@gradio/client");
            Client = GradioClient;
        }
        
        // Test backend URL connectivity first
        try {
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
        } catch (gradioError) {
            console.error('Gradio connection error:', gradioError);
            if (gradioError.message.includes('Space metadata could not be loaded')) {
                res.status(503).json({ 
                    error: 'Backend service unavailable', 
                    details: 'The Gradio backend is not accessible. Please check if the backend URL is correct and the service is running.',
                    backendUrl: backendUrl,
                    suggestion: 'Try visiting /health endpoint to check backend connectivity'
                });
            } else {
                res.status(503).json({ 
                    error: 'Gradio connection failed', 
                    details: gradioError.message,
                    backendUrl: backendUrl
                });
            }
        }
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ 
            error: 'Error during prediction', 
            details: error.message 
        });
    }
});


// Endpoint to handle image tagging
app.post('/tagger', express.json(), async (req, res) => {
    const { imageUrl } = req.body;
    let imageBase64;
    let response;
    try {
        try {
            response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.status}`);
            }
    
            // Convert image to base64 for Gemini
            const imageBuffer = await response.arrayBuffer();
            imageBase64 = Buffer.from(imageBuffer).toString('base64');
        } catch (e) {
            console.error('fetch image error', e);
        }
        
        // Get image MIME type
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        
        const genAI = new GoogleGenerativeAI(api_token);
        const model = genAI.getGenerativeModel(
            { model: "gemini-2.5-flash" },
            {
                baseUrl: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/google-ai-studio`,
            },
        );

        // Create content with both text and image
        const content = [
            {
                text: label_prompt
            },
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: contentType
                }
            }
        ];

        const result = await model.generateContent(content);
        const response_text = result.response.text();
        // Try to parse the JSON response
        let tags = [];
        try {
            // Clean the response text (remove markdown formatting if present)
            const cleanText = response_text.replace(/```json\n?|\n?```/g, '').trim();
            tags = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('Failed to parse tags JSON:', parseError);
            console.log('Raw response:', response_text);
            // Fallback: try to extract tags from text
            tags = response_text.match(/\[(.*?)\]/)?.[1]?.split(',').map(tag => tag.trim().replace(/"/g, '')) || [];
        }

        res.status(200).json({ 
            success: true, 
            tags: tags,
            rawResponse: response_text 
        });
    } catch (error) {
        console.error('Tagger error:', error);
        res.status(500).json({ error: 'Error during tagging', details: error.message });
    }
});

// ==================== Authentication & User APIs ====================

// Get current user endpoint
app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
        const user = await findOrCreateUser(req.clerkId, req.userEmail);
        const dailyCount = await getDailyCount(req.clerkId);
        
        res.json({
            id: user.clerkId,
            email: user.email,
            tier: user.tier,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionEndDate: user.subscriptionEndDate,
            dailyCount: dailyCount,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Update daily count endpoint
app.post('/api/user/update-count', authenticate, async (req, res) => {
    try {
        const user = await updateDailyCount(req.clerkId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ 
            dailyCount: user.dailyCount,
            tier: user.tier,
        });
    } catch (error) {
        console.error('Update count error:', error);
        res.status(500).json({ error: 'Failed to update count' });
    }
});

// ==================== Payment APIs ====================

// Create checkout session
app.post('/api/payment/create-checkout', authenticate, async (req, res) => {
    try {
        const { priceId } = req.body;
        
        if (!priceId) {
            return res.status(400).json({ error: 'Price ID is required' });
        }

        const session = await createCheckoutSession(req.clerkId, priceId);
        res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Stripe webhook endpoint
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('Stripe webhook secret not configured');
        return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const clerkId = session.metadata?.userId || session.client_reference_id;
            
            if (clerkId) {
                // Get subscription details
                const subscriptionId = session.subscription;
                if (subscriptionId) {
                    const subscription = await getSubscription(subscriptionId);
                    const endDate = new Date(subscription.current_period_end * 1000);
                    
                    await updateSubscription(clerkId, {
                        subscriptionId: subscriptionId,
                        status: subscription.status === 'active' ? 'active' : 'canceled',
                        endDate: endDate,
                    });
                }
            }
        } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            
            // Find user by subscription ID
            const User = require('./models/user').User;
            const user = await User.findOne({ subscriptionId: subscription.id });
            
            if (user) {
                const endDate = subscription.current_period_end 
                    ? new Date(subscription.current_period_end * 1000) 
                    : null;
                
                await updateSubscription(user.clerkId, {
                    subscriptionId: subscription.id,
                    status: subscription.status === 'active' ? 'active' : 'canceled',
                    endDate: endDate,
                });
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

// Cancel subscription endpoint
app.post('/api/payment/cancel-subscription', authenticate, async (req, res) => {
    try {
        const user = await findUserByClerkId(req.clerkId);
        if (!user || !user.subscriptionId) {
            return res.status(404).json({ error: 'No active subscription found' });
        }

        await cancelSubscription(user.subscriptionId);
        
        await updateSubscription(req.clerkId, {
            subscriptionId: user.subscriptionId,
            status: 'canceled',
            endDate: user.subscriptionEndDate,
        });

        res.json({ success: true, message: 'Subscription canceled' });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// ==================== Clerk Webhook ====================

// Clerk webhook endpoint
app.post('/api/webhooks/clerk', express.json(), async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type === 'user.created' || type === 'user.updated') {
            const clerkId = data.id;
            const email = data.email_addresses?.[0]?.email_address || data.primary_email_address?.email_address;
            
            if (clerkId && email) {
                await findOrCreateUser(clerkId, email);
            }
        }
        
        res.json({ received: true });
    } catch (error) {
        console.error('Clerk webhook error:', error);
        res.status(400).json({ error: 'Webhook processing failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});