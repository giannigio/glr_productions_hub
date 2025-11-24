FROM node:20-alpine

WORKDIR /app

# Installa dipendenze
COPY package*.json ./
RUN npm install

# Copia il codice del backend
COPY . .

# Genera il client Prisma in fase di build
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "index.js"]
