FROM node:20-bullseye AS frontend
WORKDIR /app/count_app
COPY count_app/package*.json ./
RUN npm install
COPY count_app .
ENV NODE_ENV="production"
ARG VITE_API_BASE_URL="http://localhost:3000"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_CLERK_PUBLISHABLE_KEY=""
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_STRIPE_PRICE_ID_MONTHLY=""
ENV VITE_STRIPE_PRICE_ID_MONTHLY=$VITE_STRIPE_PRICE_ID_MONTHLY
ARG VITE_STRIPE_PRICE_ID_ANNUAL=""
ENV VITE_STRIPE_PRICE_ID_ANNUAL=$VITE_STRIPE_PRICE_ID_ANNUAL
RUN npm run build

FROM node:20-bullseye AS backend
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY server ./server
COPY shared ./shared
COPY uploads ./uploads
COPY --from=frontend /app/count_app/build ./count_app/build
ENV NODE_ENV="production"
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/server.js"]

