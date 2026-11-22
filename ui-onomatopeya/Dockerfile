# Etapa 1: compilar Angular
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: servir la aplicación con Nginx
FROM nginx:alpine

COPY --from=build /app/dist/ui-onomatopeya/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
