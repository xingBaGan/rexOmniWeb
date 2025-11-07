# RexOmniWeb

A web application with AI-powered image processing capabilities.

## Project Structure

```
rexOmniWeb/
├── server/              # Backend server
│   └── server.js        # Express server with API endpoints
├── count app/           # React frontend application
│   └── src/
│       ├── services/   # API client services
│       └── components/ # React components
├── shared/              # Shared code
│   └── api/            # API configuration
└── package.json         # Root package.json
```

## API Endpoints

The server provides the following endpoints:

- `POST /upload` - Upload image file to Cloudflare R2
- `POST /predict` - Predict objects in an image
- `POST /tagger` - Get tags for an image using Gemini AI
- `GET /health` - Health check for backend connectivity

## Setup

### Backend Server

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
GOOGLE_AI_STUDIO_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_GATEWAY_ID=your_gateway_id
BACKEND_URL=your_backend_url
R2_ENDPOINT=your_r2_endpoint
R2_BUCKET=your_r2_bucket
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET_KEY=your_r2_secret_key
BASE_URL=your_base_url
PORT=3000
```

3. Start the server:
```bash
npm start
# or
npm run dev:server
```

### Count App (Frontend)

1. Navigate to the count app directory:
```bash
cd "count app"
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with:
```
VITE_API_BASE_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
# or from root:
npm run dev:count-app
```

## Usage

1. Start the backend server (port 3000)
2. Start the count app frontend (default port 3000, may conflict - adjust in vite.config.ts)
3. Open the count app in your browser
4. Upload an image to process it with AI

## Development

- Backend server runs on port 3000 by default
- Count app frontend runs on port 3000 (check vite.config.ts for actual port)
- Make sure to configure CORS if running on different ports

