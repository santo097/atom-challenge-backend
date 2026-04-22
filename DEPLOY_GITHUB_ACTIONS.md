# 🚀 Deploy automático con GitHub Actions

Este documento explica cómo configurar el deploy automático del backend a Firebase Cloud Functions cada vez que se hace push a `main`.

## 📋 Qué vas a necesitar

- [ ] Acceso al proyecto Firebase `atom-challenge-88068` con rol Owner
- [ ] Acceso al repo de GitHub como admin
- [ ] ~10 minutos

---

## 🔐 Paso 1: Crear un service account para GitHub Actions

No queremos que GitHub use tu service account personal (el de admin del SDK). Creamos uno **dedicado al CI/CD** con los permisos mínimos necesarios.

### 1.1 — Abrir Google Cloud IAM

```
https://console.cloud.google.com/iam-admin/serviceaccounts?project=atom-challenge-88068
```

### 1.2 — Crear nuevo service account

- Click **"+ CREAR CUENTA DE SERVICIO"**
- Nombre: `github-actions-deployer`
- Descripción: `Service account para deploys automáticos desde GitHub Actions`
- Click **"CREAR Y CONTINUAR"**

### 1.3 — Asignar roles necesarios

En el paso "Conceder acceso al proyecto", añade **TODOS** estos roles uno por uno:

| Rol | Por qué |
|---|---|
| `Firebase Admin` | Deploy a Firebase (functions + Firestore rules) |
| `Cloud Functions Admin` | Crear/actualizar funciones |
| `Cloud Build Editor` | Build de la function durante el deploy |
| `Artifact Registry Administrator` | Subir imágenes del build |
| `Cloud Run Admin` | Cloud Functions v2 corre sobre Cloud Run |
| `Service Account User` | Puede impersonar el SA de runtime de la function |
| `Secret Manager Secret Accessor` | Leer JWT_SECRET al desplegar |

Click **"CONTINUAR"** y luego **"LISTO"**.

### 1.4 — Descargar la clave JSON

- En la lista de service accounts, encuentra `github-actions-deployer@atom-challenge-88068.iam.gserviceaccount.com`
- Click en los **3 puntos** (⋮) al final de la fila → **"Administrar claves"**
- Click **"AGREGAR CLAVE"** → **"Crear clave nueva"**
- Tipo: **JSON**
- Click **"CREAR"** → se descarga un archivo `.json`

> ⚠️ Guarda este archivo con cuidado. **NO lo subas a GitHub**. Lo vamos a pegar en un secret.

---

## 🔒 Paso 2: Configurar secrets en GitHub

### 2.1 — Ir a la configuración de secrets

```
https://github.com/santo097/atom-challenge-backend/settings/secrets/actions
```

### 2.2 — Añadir el secret FIREBASE_SERVICE_ACCOUNT

- Click **"New repository secret"**
- Name: `FIREBASE_SERVICE_ACCOUNT`
- Value: **pega el contenido COMPLETO** del archivo JSON que descargaste (desde `{` hasta `}`)
- Click **"Add secret"**

### 2.3 — Añadir la variable FIREBASE_PROJECT_ID

Ahora en la pestaña **"Variables"** (al lado de "Secrets"):

- Click **"New repository variable"**
- Name: `FIREBASE_PROJECT_ID`
- Value: `atom-challenge-88068`
- Click **"Add variable"**

> 💡 ¿Por qué variable y no secret? El projectId no es sensible, está en la URL pública de la API.

---

## 🚀 Paso 3: Probar el deploy automático

### 3.1 — Deploy manual (primera prueba)

- Ve a la pestaña **"Actions"** del repo
- Click en **"Deploy to Firebase"** (en el menú lateral izquierdo)
- Click **"Run workflow"** → **"Run workflow"** (botón verde)

El deploy empezará en unos segundos y tomará ~5-10 minutos.

### 3.2 — Deploy automático al push

A partir de ahora, **cada push a `main`** dispara automáticamente:

1. `pre-deploy-checks` — lint + typecheck + tests unitarios + build
2. Si todo pasa → `deploy` a Firebase Cloud Functions

Si cualquier check falla, el deploy NO se ejecuta. Tu `main` queda protegido.

---

## 🛡️ Paso 4 (opcional): Proteger el branch `main`

Para evitar pushes directos accidentales:

```
https://github.com/santo097/atom-challenge-backend/settings/branches
```

- Click **"Add branch protection rule"**
- Branch name pattern: `main`
- Activar: **"Require a pull request before merging"**
- Activar: **"Require status checks to pass before merging"**
  - Buscar y seleccionar: `Lint · TypeCheck · Build`, `Unit tests`, `Integration tests (Firestore emulator)`
- Guardar

Con esto, nadie (incluyéndote a ti) puede pushear directo a `main` — debe abrir un PR que pase el CI primero.

---

## 🐛 Troubleshooting

### "Permission denied" en algún deploy step

El service account le falta un rol. Vuelve al Paso 1.3 y añade el rol que mencione el error.

### "Secret JWT_SECRET not found"

El secret JWT_SECRET no se configura automáticamente. Debes hacerlo una vez con tu usuario normal:

```bash
firebase functions:secrets:set JWT_SECRET
# pega el valor cuando te lo pida
```

Esto solo se hace **una vez**. El service account del CI ya tiene permiso de leerlo.

### El workflow falla con "Repository variables not available"

Los variables solo están disponibles en **repos, no en forks**. Si estás en un fork, tendrás que hacerlos secrets normales.

---

## 📊 Ventajas vs deploy manual

| | Deploy manual | Deploy automático |
|---|---|---|
| Repetibilidad | Humano olvida pasos | Idéntico cada vez |
| Auditoría | Solo la terminal local | Log completo en GitHub Actions |
| Pre-checks | Puedes desplegar código con bugs | Imposible: tests deben pasar |
| Tiempo | 5-10 min con intervención | 5-10 min automático |
| Rollback | Complejo | Re-run del workflow anterior |

---

## 🎯 Resumen

Con los 2 workflows:

- **`ci.yml`** — corre en cada push/PR para validar el código
- **`deploy.yml`** — corre solo en push a `main` (o manual) para desplegar

Si alguna vez quieres **forzar un deploy sin push**, vas a Actions → Deploy to Firebase → Run workflow.
