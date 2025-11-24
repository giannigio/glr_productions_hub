# =========================
# 1. BUILD STAGE
# =========================
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# =========================
# 2. PRODUCTION STAGE
# =========================
FROM nginx:alpine

# Copia la build Vite dentro Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia la configurazione Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
