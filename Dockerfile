FROM node:20-bullseye AS frontend
WORKDIR /app/count_app
COPY count_app/package*.json ./
RUN npm install
COPY count_app .
ARG VITE_API_BASE_URL="http://localhost:3000"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
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

