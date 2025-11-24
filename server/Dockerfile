# BACKEND DOCKERFILE PER PRISMA + POSTGRES
# Usa Debian, NON Alpine, per evitare problemi con OpenSSL/libssl

FROM node:20-bullseye

WORKDIR /app

# Copia package.json e package-lock.json (se presente)
COPY package*.json ./

# Installa tutte le dipendenze (anche dev, ci serve Prisma CLI)
RUN npm install

# Copia il resto del codice del backend
COPY . .

# Genera il client Prisma durante il build
RUN npx prisma generate

EXPOSE 3000

# Avvia solo il server Node (niente migrate deploy: il DB lo gestisci tu via .sql)
CMD ["node", "index.js"]
