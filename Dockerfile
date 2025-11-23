# Stage 1: Build React App
FROM node:18-alpine as build

WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia tutto il resto del codice
COPY . .

# Compila l'app per la produzione (crea la cartella /dist)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copia i file compilati dalla fase precedente alla cartella di Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia la configurazione personalizzata di Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Espone la porta 80
EXPOSE 80

# Avvia Nginx
CMD ["nginx", "-g", "daemon off;"]
