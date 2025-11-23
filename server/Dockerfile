FROM node:18-alpine

WORKDIR /app

# Copia dipendenze backend
COPY package*.json ./
RUN npm install

# Copia codice backend
COPY . .

# Genera il client Prisma per il database
RUN npx prisma generate

# Espone la porta 3000
EXPOSE 3000

# Avvia il server
CMD ["node", "index.js"]
