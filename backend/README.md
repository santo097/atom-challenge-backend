# ATOM Challenge — Backend

API REST para la aplicación de tareas del challenge técnico de ATOM.
Express + TypeScript sobre Firebase Cloud Functions con Firestore.

> Implementado con **arquitectura hexagonal** (ports & adapters), tests
> unitarios + integración, y todas las decisiones de seguridad, validación
> y manejo de errores que evalúa el challenge.

---

## 📑 Tabla de contenidos

1. [Arquitectura](#-arquitectura)
2. [Stack técnico](#-stack-técnico)
3. [Requisitos previos](#-requisitos-previos)
4. [Configuración inicial](#-configuración-inicial)
5. [Cómo correrlo en local](#-cómo-correrlo-en-local)
6. [Tests](#-tests)
7. [Endpoints de la API](#-endpoints-de-la-api)
8. [Ejemplos con curl](#-ejemplos-con-curl)
9. [Despliegue a Firebase](#-despliegue-a-firebase)
10. [Estructura del proyecto](#-estructura-del-proyecto)
11. [Decisiones técnicas](#-decisiones-técnicas)

---

## 🏛️ Arquitectura

**Hexagonal (ports & adapters)**: el dominio es el núcleo y no depende
de ningún framework. Express y Firestore son adaptadores que implementan
puertos definidos por el dominio.

```
┌────────────────────────────────────────────────┐
│  Infrastructure (Express, Firestore, JWT)      │
│  ┌──────────────────────────────────────────┐  │
│  │  Application (use cases, DTOs, ports)    │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │  Domain (entities, repos, errors)  │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
         Las flechas de dependencia apuntan
         siempre hacia el centro
```

**Flujo típico de un request:**

```
HTTP request
  → Express middleware (requestId, CORS, JSON parser)
  → authenticate middleware (valida JWT → req.user)
  → validate middleware (zod schema sobre body/params/query)
  → controller (extrae datos del request)
  → use case (orquesta el dominio)
  → domain entity (valida invariantes)
  → repository port → Firestore adapter
  → response mapper → JSON
  → errorHandler (si algo falla en cualquier paso)
```

---

## 🛠️ Stack técnico

- **Runtime**: Node.js 20
- **Framework**: Express 4 sobre Firebase Cloud Functions v2
- **Lenguaje**: TypeScript en modo estricto (`strict: true` + `noUncheckedIndexedAccess`)
- **Persistencia**: Firestore (Admin SDK)
- **Seguridad**: JWT (HS256) con `jsonwebtoken`, Helmet, CORS con whitelist
- **Validación**: zod (schemas con inferencia de tipos)
- **Testing**: Jest + ts-jest (unitarios) + supertest (integración)
- **Linter/Formatter**: ESLint con reglas `type-aware` + Prettier

---

## 📋 Requisitos previos

- **Node.js ≥ 20** (`node --version`)
- **npm ≥ 10**
- **Firebase CLI**: `npm install -g firebase-tools` (para emuladores y deploy)
- **Java JDK ≥ 11** (requerido por el Firestore emulator): `java -version`
- **Cuenta de Firebase** con proyecto creado en plan Blaze
- **Service account JSON** descargado del proyecto Firebase

---

## ⚙️ Configuración inicial

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Crear `.env`

Copia el template y completa:

```bash
cp .env.example .env
```

Valores requeridos:

| Variable | Cómo obtenerlo |
|---|---|
| `JWT_SECRET` | Ejecutar: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `FIREBASE_PROJECT_ID` | Consola Firebase → ⚙️ → General → "ID del proyecto" |
| `GOOGLE_APPLICATION_CREDENTIALS` | Ruta al JSON del service account (ver paso 3) |
| `CORS_ORIGINS` | Orígenes del frontend, separados por coma. Default: `http://localhost:4200` |

### 3. Service account

1. Firebase Console → ⚙️ (Configuración del proyecto) → **Cuentas de servicio**
2. Click en **"Generar nueva clave privada"** → descargar JSON
3. Guardar como `backend/service-account.json` (ya está en `.gitignore`)

### 4. Verificar que todo está en su sitio

```bash
npm run typecheck    # debe salir sin errores
npm run lint         # debe salir limpio
npm test             # debe correr 70/70 tests unitarios
```

---

## 🚀 Cómo correrlo en local

### Opción A — Express directo (sin emulador Firebase, usa Firestore real)

```bash
npm run dev
```

Escucha en `http://localhost:3000`. Los datos se escriben en tu Firestore
real del proyecto Firebase. Útil para desarrollo contra datos reales.

### Opción B — Firebase emulator (Firestore local, sin costo, aislado)

En una terminal:

```bash
npm run emulator
```

Esto arranca el emulador de Firestore en `localhost:8080` con UI web en
`localhost:4000`. En **otra** terminal, edita tu `.env` descomentando:

```
FIRESTORE_EMULATOR_HOST=localhost:8080
```

Y arranca el server normal:

```bash
npm run dev
```

Ahora el backend escribe en el emulador (datos locales, reseteables).

### Health check

```bash
curl http://localhost:3000/health
```

Respuesta:

```json
{ "status": "ok", "timestamp": "2025-04-21T...", "env": "development" }
```

---

## 🧪 Tests

Hay **dos suites separadas**:

### Tests unitarios (70 tests, sin dependencias externas)

Dominio + casos de uso con repositorios in-memory y fakes deterministas.

```bash
npm test                   # corre todos los unitarios
npm run test:watch         # modo watch
npm run test:coverage      # con reporte de cobertura (HTML en coverage/)
```

### Tests de integración (con Firestore emulator)

Requests reales contra la API completa con supertest + emulador Firestore.
Un test por endpoint cubriendo happy path + errores principales (400, 401,
403, 404, 409).

```bash
npm run test:integration
```

Este comando arranca el emulador automáticamente, ejecuta los tests y
apaga el emulador al terminar (`firebase emulators:exec`).

### Correr ambas suites

```bash
npm run test:all
```

---

## 📡 Endpoints de la API

**Base URL local**: `http://localhost:3000/api/v1`
**Base URL desplegado**: `https://us-central1-<PROJECT_ID>.cloudfunctions.net/api/api/v1`

### Público (no requiere token)

| Método | Path | Descripción | Status |
|---|---|---|---|
| `POST` | `/auth/login` | Login passwordless por email | 200 / 404 / 400 |
| `POST` | `/auth/register` | Registrar nuevo usuario y obtener token | 201 / 409 / 400 |
| `GET` | `/users/:email` | Busca usuario por email | 200 / 404 / 400 |
| `POST` | `/users` | Crea nuevo usuario (sin token) | 201 / 409 / 400 |
| `GET` | `/health` | Health check | 200 |

### Protegido (requiere `Authorization: Bearer <token>`)

| Método | Path | Descripción | Status |
|---|---|---|---|
| `GET` | `/tasks` | Lista tareas del usuario autenticado | 200 / 401 |
| `GET` | `/tasks?completed=true` | Filtra tareas completadas | 200 / 401 / 400 |
| `GET` | `/tasks?completed=false` | Filtra tareas pendientes | 200 / 401 / 400 |
| `POST` | `/tasks` | Crea nueva tarea | 201 / 400 / 401 |
| `PUT` | `/tasks/:id` | Actualiza tarea (parcial) | 200 / 400 / 401 / 403 / 404 |
| `DELETE` | `/tasks/:id` | Elimina tarea | 204 / 401 / 403 / 404 |

### Formato de error consistente

Todos los errores siguen esta forma:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid body: title: title cannot be empty",
    "requestId": "a3c1-..."
  }
}
```

| `code` | HTTP | Significado |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Body/params/query inválidos |
| `UNAUTHORIZED` | 401 | Token ausente, inválido o expirado |
| `FORBIDDEN` | 403 | Recurso de otro usuario |
| `NOT_FOUND` | 404 | Recurso no existe |
| `CONFLICT` | 409 | Email duplicado |
| `ROUTE_NOT_FOUND` | 404 | Endpoint inexistente |
| `INTERNAL_ERROR` | 500 | Error no esperado (detalles en logs, no en response) |

---

## 💻 Ejemplos con curl

Asumiendo el server corriendo en `http://localhost:3000`:

### Registrar un usuario nuevo

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com"}'
```

Respuesta:
```json
{
  "user": { "id": "...", "email": "alice@example.com", "createdAt": "2025-04-21T..." },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "1h"
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com"}'
```

### Buscar si existe un usuario (antes de login)

```bash
curl http://localhost:3000/api/v1/users/alice@example.com
```

Retorna 200 si existe, 404 si no.

### Crear una tarea

```bash
TOKEN="<token del paso de register/login>"

curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy milk", "description": "Semi-skimmed"}'
```

### Listar tareas

```bash
# todas
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/tasks

# solo pendientes
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/tasks?completed=false"

# solo completadas
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3000/api/v1/tasks?completed=true"
```

### Toggle completed (update parcial)

```bash
curl -X PUT http://localhost:3000/api/v1/tasks/<TASK_ID> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Editar título y descripción

```bash
curl -X PUT http://localhost:3000/api/v1/tasks/<TASK_ID> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Buy oat milk", "description": "Not soy"}'
```

### Eliminar

```bash
curl -X DELETE http://localhost:3000/api/v1/tasks/<TASK_ID> \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚢 Despliegue a Firebase

### Primera vez

```bash
# Desde la raíz del repo (no dentro de backend/)
cd ..
firebase login
firebase use atom-challenge    # o el projectId que corresponda
```

### Configurar secretos en Firebase

Cloud Functions no debe leer `.env` (no se commitea). Los secretos viven
en Firebase Secret Manager:

```bash
# Setear los secretos (te va a pedir el valor)
firebase functions:secrets:set JWT_SECRET
firebase functions:secrets:set JWT_EXPIRES_IN

# Las variables no secretas van en .env.production (se commitea)
echo "CORS_ORIGINS=https://tu-frontend-prod.web.app" > backend/.env.production
echo "FIREBASE_PROJECT_ID=atom-challenge" >> backend/.env.production
```

> Nota: para exponer los secretos en runtime, habría que agregarlos al
> `onRequest` en `src/index.ts` con la opción `secrets: [...]`. Para este
> challenge usamos `.env` estándar (más simple); migración a Secret Manager
> es un paso opcional de producción.

### Deploy

```bash
# Despliega solo el backend (functions + firestore rules/indexes)
firebase deploy --only functions,firestore
```

La URL de la función queda:

```
https://us-central1-atom-challenge.cloudfunctions.net/api
```

Y la API completa se consume así:

```
https://us-central1-atom-challenge.cloudfunctions.net/api/api/v1/tasks
```

---

## 📁 Estructura del proyecto

```
backend/
├── src/
│   ├── index.ts                 # Entry point Cloud Functions
│   ├── local.ts                 # Entry point dev local
│   │
│   ├── domain/                  # Núcleo (TS puro, sin deps externas)
│   │   ├── entities/            #   User, Task — con invariantes
│   │   ├── errors/              #   DomainError + 5 subclases
│   │   └── repositories/        #   Puertos UserRepository, TaskRepository
│   │
│   ├── application/             # Orquesta el dominio
│   │   ├── dtos/                #   Comandos y respuestas + mappers
│   │   ├── ports/               #   IdGenerator, Clock, TokenService
│   │   └── use-cases/           #   Una clase por operación de negocio
│   │       ├── auth/            #     Login, Register
│   │       ├── users/           #     FindUserByEmail, CreateUser
│   │       └── tasks/           #     List, Create, Update, Delete
│   │
│   ├── infrastructure/          # Adaptadores — detalles técnicos
│   │   ├── config/              #   env (zod), container (DI), bootstrap
│   │   ├── http/                #   Express
│   │   │   ├── app.ts           #     createApp() — Helmet + CORS + rutas
│   │   │   ├── controllers/     #     Auth, User, Task
│   │   │   ├── middlewares/     #     authenticate, validate, errorHandler...
│   │   │   ├── routes/          #     buildAuthRouter, etc.
│   │   │   └── validators/      #     Schemas zod por endpoint
│   │   ├── persistence/
│   │   │   └── firestore/       #     Impl Firestore de los repositorios
│   │   └── security/            #   JwtTokenService, SystemClock, UuidIdGen
│   │
│   └── shared/                  # Utilidades transversales
│       ├── types/               #   Extensiones de tipos (Request.user)
│       └── utils/               #   Logger estructurado
│
└── tests/
    ├── unit/                    # 70 tests unitarios
    │   ├── domain/              #   User, Task entities
    │   ├── application/         #   Los 8 use cases
    │   └── helpers/             #   Repos in-memory, fakes deterministas
    │
    └── integration/             # Tests con Firestore emulator
        ├── setup.ts
        ├── helpers.ts
        ├── auth.integration.spec.ts
        ├── users.integration.spec.ts
        ├── tasks.integration.spec.ts
        └── health.integration.spec.ts
```

---

## 🎯 Decisiones técnicas

### 1. ¿Por qué una sola Cloud Function con Express?

En vez de `N` functions (una por endpoint), exportamos una sola function
`api` que delega a Express. Ventajas:
- Menos cold starts (una sola función = una sola instancia caliente)
- Ruteo, middlewares y error handling en un solo lugar
- Idéntico comportamiento en local (`npm run dev`) y producción

### 2. JWT en lugar de Firebase Auth

El PDF pide solo email, sin contraseña. Firebase Auth con magic links
añadiría configuración de templates de email, dominios autorizados y
redirecciones. JWT simple es suficiente, testeable y evaluable en el
criterio de "seguridad en comunicación con el API (tokens, autenticación)".

### 3. Entidades inmutables con factorías

`Task.edit()` y `Task.toggleCompleted()` devuelven nuevas instancias en
lugar de mutar. Esto elimina efectos laterales en los casos de uso y
hace los tests triviales: un input, un output, sin estado compartido.

### 4. `belongsTo(userId)` en vez de comparar IDs sueltos

Los bugs de autorización suelen nacer de `if (task.userId === currentUser)`
olvidado en un endpoint. Encapsular la regla en la entidad centraliza el
chequeo y lo hace explícito en los casos de uso.

### 5. Validación en dos capas

- **zod** valida forma del request (tipos, longitudes, formato) → 400
- **entidad** valida invariantes de dominio (título no vacío, email válido)

Esto da defensa en profundidad: aunque un adaptador olvide validar, el
dominio nunca acepta un estado inválido.

### 6. Composition root manual

Un archivo (`container.ts`) arma todo el grafo con `new`. Sin frameworks
de DI (InversifyJS, tsyringe): el grafo es pequeño, todo queda visible
de un vistazo y no hay magia de decoradores.

### 7. Error handler centralizado

Las excepciones fluyen naturalmente: casos de uso lanzan `DomainError`,
el middleware las convierte en JSON consistente con `code`, `message` y
`requestId`. Cualquier error no mapeado → 500 con mensaje opaco + log
completo (nunca exponemos stacks al cliente).

### 8. Tests de integración con emulador

El emulador de Firestore es un Java local que se comporta como Firestore
real (misma API, mismos índices). Correr los tests contra él valida que
los adaptadores Firestore funcionan de verdad, sin tocar producción ni
costar dinero.

---

## 📜 Scripts disponibles

```bash
npm run dev                # Dev server con hot reload
npm run build              # Compila TypeScript a dist/
npm run build:watch        # Compila en modo watch
npm run lint               # ESLint check
npm run lint:fix           # ESLint auto-fix
npm run format             # Prettier format
npm run format:check       # Prettier check
npm run typecheck          # TS compile check (sin emitir)
npm test                   # Tests unitarios
npm run test:watch         # Tests en modo watch
npm run test:coverage      # Tests con coverage HTML en coverage/
npm run test:integration   # Tests de integración con emulator
npm run test:all           # Unitarios + integración
npm run emulator           # Firestore emulator standalone
npm run serve              # Build + emulator de functions
npm run deploy             # Deploy a Firebase (build + deploy)
npm run logs               # Ver logs de Cloud Functions en Firebase
```

---

## 📄 Licencia

MIT
