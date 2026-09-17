# Stage 1: build
FROM node:20-slim AS build
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install --production=false

COPY frontend/ ./
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
