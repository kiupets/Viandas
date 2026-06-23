# Viandas Zarate

App mobile-first para viandas con MongoDB, React y calendario operativo reutilizado desde `calendar-lab`.

## Variables

Crear `.env`:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/viandas_zarate
PORT=4000
```

## Local

```bash
npm install
npm run seed
npm run dev
```

Frontend: `http://localhost:5173`  
API: `http://localhost:4000`

## Produccion / VPS

Recomendado para que OpenClaw lo administre:

```bash
cd /root
git clone https://github.com/kiupets/Viandas.git
cd Viandas
docker compose up -d --build
docker compose exec app npm run seed
```

Ver guia completa en `DEPLOY-VPS.md`.

Si el VPS usa Docker Compose viejo:

```bash
docker-compose up -d --build
docker-compose exec app npm run seed
```

### Sin Docker

```bash
npm install
npm run seed
npm run build
PORT=4000 MONGODB_URI="mongodb://127.0.0.1:27017/viandas_zarate" npm start
```

Para dejarlo fijo:

```bash
pm2 start server/index.js --name viandas --update-env
```

Luego Nginx puede apuntar el dominio a `http://127.0.0.1:4000`.
