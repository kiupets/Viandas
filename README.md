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
