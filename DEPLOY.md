# 🚀 Deploy a Firebase Cloud Functions — Guía paso a paso

Esta guía asume que ya:
- Tienes tu proyecto Firebase creado (`atom-challenge-88068`)
- Firestore habilitado en `us-central1`
- Firebase CLI instalado (`firebase --version`)
- Estás logueado con `firebase login` (la cuenta tiene rol Owner en GCP)

## 📋 Checklist pre-deploy

- [ ] `firebase login:list` muestra tu email
- [ ] Abre la consola: https://console.cloud.google.com/iam-admin/iam?project=atom-challenge-88068 y verifica que tu email tiene rol **Owner** (o al menos Editor + Cloud Functions Admin + Service Usage Admin)
- [ ] APIs habilitadas (da "Habilitar" en cada una):
  - [Cloud Functions API](https://console.cloud.google.com/apis/library/cloudfunctions.googleapis.com?project=atom-challenge-88068)
  - [Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=atom-challenge-88068)
  - [Artifact Registry API](https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com?project=atom-challenge-88068)
  - [Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com?project=atom-challenge-88068)
  - [Eventarc API](https://console.cloud.google.com/apis/library/eventarc.googleapis.com?project=atom-challenge-88068)
  - [Secret Manager API](https://console.cloud.google.com/apis/library/secretmanager.googleapis.com?project=atom-challenge-88068)

## 🛠️ Paso 1 — Configurar variables de entorno de producción

Desde la raíz del repo:

```bash
# Copiar el template y renombrarlo al projectId exacto
cp backend/.env.production.example backend/.env.atom-challenge-88068

# Editar el archivo y ajustar CORS_ORIGINS al dominio del frontend
# (por ahora lo dejamos con localhost para poder probar con curl/Postman)
```

> ⚠️ El archivo `.env.atom-challenge-88068` NO se commitea (está en .gitignore).

## 🔐 Paso 2 — Configurar el JWT_SECRET en Secret Manager

Desde la raíz del repo:

```bash
# Esto abre un prompt donde pegas tu JWT_SECRET
firebase functions:secrets:set JWT_SECRET
```

Pega el mismo valor de `JWT_SECRET` que tienes en tu `.env` local (sin los espacios finales, el schema lo normalizará igual).

Para verificar que quedó bien:

```bash
firebase functions:secrets:access JWT_SECRET
```

Debería imprimir el secreto.

## 🏗️ Paso 3 — Build local (sanity check)

```bash
cd backend
npm run build
```

Debe terminar sin errores y crear la carpeta `dist/`.

## 🚀 Paso 4 — Deploy

Desde la raíz del repo (donde está el `firebase.json`):

```bash
# Desplegar primero reglas e índices de Firestore
firebase deploy --only firestore

# Luego la función HTTP
firebase deploy --only functions
```

O todo junto:

```bash
firebase deploy --only firestore,functions
```

El primer deploy toma **5-10 minutos**. Los siguientes son más rápidos (~2 min).

## ✅ Paso 5 — Verificar que la API pública funciona

Cuando termine el deploy, verás un mensaje con la URL:

```
Function URL (api(us-central1)): https://us-central1-atom-challenge-88068.cloudfunctions.net/api
```

Prueba el health check:

```bash
curl https://us-central1-atom-challenge-88068.cloudfunctions.net/api/health
```

Respuesta esperada:
```json
{"status":"ok","timestamp":"...","env":"production"}
```

Prueba registro:

```bash
curl -X POST https://us-central1-atom-challenge-88068.cloudfunctions.net/api/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@atomchallenge.com"}'
```

> ⚠️ Nota la doble `/api/api/v1/...`: la primera `api` es el nombre de la function, la segunda el prefijo de nuestra API.

## 🔍 Ver logs en vivo

```bash
firebase functions:log --only api
```

O en la consola:
https://console.cloud.google.com/functions/details/us-central1/api?project=atom-challenge-88068&tab=logs

## 🐛 Troubleshooting

### Error: "Permission denied" al hacer deploy
→ Tu usuario no tiene el rol Owner. Revisa el paso de IAM arriba.

### Error: "API [xxx] not enabled"
→ Habilita la API correspondiente desde los links del checklist.

### Error: "Service account ... does not have permission to access secret"
→ Cuando configuras un secret por primera vez, Firebase crea un service account que necesita permisos. Ejecuta:
```bash
firebase functions:secrets:access JWT_SECRET
```
Si da permission denied, la consola te dará un link para autorizarlo.

### El endpoint responde 500 "An unexpected error occurred"
→ Revisa los logs: `firebase functions:log`. Probablemente JWT_SECRET no está configurado.

### CORS errors desde el frontend
→ Añade el dominio del frontend a `CORS_ORIGINS` en `.env.atom-challenge-88068` y re-deploy.

## 🔁 Re-deploy después de cambios de código

Cada vez que cambies código:

```bash
firebase deploy --only functions
```

## 💰 Costos

Con el plan Blaze, el free tier incluye:
- 2 millones de invocaciones/mes
- 400,000 GB-segundos de compute
- 200,000 GHz-segundos
- 5 GB de egress

Para este challenge el consumo será **< 0.1% del free tier** — no vas a pagar nada. Puedes configurar un presupuesto de alerta en `$1` por tranquilidad.
