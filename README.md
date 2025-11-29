<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

Questa repo contiene tutto il necessario per eseguire l'app su un VPS utilizzando Supabase come database gestito.

## Configurazione

1. Crea un progetto Supabase e genera una **Service Role Key**.
2. Configura le tabelle con gli stessi nomi utilizzati dalle API (`jobs`, `locations`, `inventory_items`, `standard_material_lists`, `rentals`, `crew_members`, `users`, `app_settings`, `company_expenses`, `recurring_payments`, `personnel_costs`).
3. Copia `server/.env.example` in `server/.env` e imposta le variabili:
   ```bash
   SUPABASE_URL=https://<your-project>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   PORT=3000
   ```
4. Facoltativo: imposta `VITE_API_URL` per il frontend (default `/api`).

## Avvio in locale

Prerequisiti: Node.js 18+

```bash
npm install
npm run dev
```

Il backend Express legge le variabili da `server/.env` e si connette a Supabase.

## Deploy con Docker Compose

```bash
docker-compose build
docker-compose up -d
```

La compose definisce due servizi:
- **api**: server Express collegato a Supabase
- **web**: bundle statico Vite servito da Nginx, che inoltra `/api` al backend

## Endpoint principali

- `POST /api/login` – controlla l'utente nella tabella `users`
- CRUD su `/api/jobs`, `/api/locations`, `/api/inventory`, `/api/standard-lists`, `/api/rentals`, `/api/company-expenses`, `/api/recurring-payments`, `/api/personnel-costs`
- `GET/PUT /api/settings` – salva/legge la configurazione applicativa
- `GET /api/crew` e `PUT /api/crew/:id` – gestione anagrafica crew

Per la salute del servizio è presente `GET /api/health`.
