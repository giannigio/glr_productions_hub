FROM node:20-alpine

WORKDIR /app

# Copia pacchetti
COPY package*.json ./
RUN npm install

# Copia il resto del backend
COPY . .

# Genera Prisma client
RUN npx prisma generate

# Migrazioni in produzione
CMD npx prisma migrate deploy && node index.js

EXPOSE 3000
