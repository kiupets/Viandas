# Deploy en VPS

Este deploy deja la app y Mongo corriendo en Docker, con datos persistentes en el volumen `viandas_mongo`.

## 1. Instalar Docker

```bash
apt update
apt install -y docker.io docker-compose-plugin
systemctl enable --now docker
```

## 2. Clonar o actualizar

```bash
cd /root
git clone https://github.com/kiupets/Viandas.git
cd /root/Viandas
```

Si ya existe:

```bash
cd /root/Viandas
git pull
```

## 3. Levantar app + Mongo

```bash
docker compose up -d --build
```

## 4. Cargar datos iniciales

```bash
docker compose exec app npm run seed
```

## 5. Ver logs

```bash
docker compose logs -f app
```

La app queda escuchando en:

```text
http://IP_DEL_VPS:4000
```

Para dominio con Nginx, apuntar el proxy a:

```text
http://127.0.0.1:4000
```

## Comandos utiles

```bash
docker compose ps
docker compose restart app
docker compose down
docker compose up -d --build
```
