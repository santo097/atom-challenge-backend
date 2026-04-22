# ATOM Challenge — Backend Repository

[![CI](https://github.com/santo097/atom-challenge-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/santo097/atom-challenge-backend/actions/workflows/ci.yml)

API REST para la aplicación de lista de tareas del challenge técnico de ATOM,
desarrollada con **Express + TypeScript** sobre **Firebase Cloud Functions**
con **Firestore** como base de datos.

> Este repositorio contiene **únicamente el backend**. El frontend vive en
> un repositorio separado.

## 🚀 Quick start

```bash
cd backend
npm install
cp .env.example .env    # completa con tus credenciales de Firebase
npm test                # correr tests unitarios (70 tests)
npm run dev             # levantar el server en localhost:3000
```

Ver la [documentación completa en `backend/README.md`](./backend/README.md)
con setup paso a paso, ejemplos de requests, guía de tests de integración
y proceso de despliegue.

## 🏛️ Arquitectura

**Hexagonal (ports & adapters)** con separación estricta de capas:

```
backend/src/
├── domain/          ← Núcleo — reglas de negocio puras (sin deps)
├── application/     ← Casos de uso (orquesta el dominio)
├── infrastructure/  ← Adaptadores (Express, Firestore, JWT)
└── shared/          ← Utilidades transversales
```

## ✅ Estado del proyecto

- [x] Arquitectura hexagonal completa
- [x] 8 casos de uso (auth + users + tasks CRUD con ownership)
- [x] Adaptadores Firestore con índices correctos
- [x] Express app con Helmet, CORS whitelist, validación zod, error handler central
- [x] Autenticación JWT con middleware
- [x] **70 tests unitarios** (dominio + application con repos in-memory)
- [x] **Tests de integración** con Firestore emulator (1 archivo por grupo de endpoints, happy path + errores)
- [x] TypeScript estricto (`strict: true` + `noUncheckedIndexedAccess`)
- [x] ESLint type-aware + Prettier
- [x] README completo con ejemplos curl y guía de deploy
- [x] CI/CD con GitHub Actions (lint + tests en cada push/PR)

## 📋 Endpoints (API v1)

### Públicos

- `POST /api/v1/auth/register` — Registrar usuario y obtener token
- `POST /api/v1/auth/login` — Login passwordless
- `GET /api/v1/users/:email` — Buscar usuario por email
- `POST /api/v1/users` — Crear usuario (endpoint explícito del challenge)
- `GET /health` — Health check

### Protegidos (requieren `Authorization: Bearer <token>`)

- `GET /api/v1/tasks` — Listar tareas del usuario (filtro `?completed=true|false`)
- `POST /api/v1/tasks` — Crear tarea
- `PUT /api/v1/tasks/:id` — Actualizar (título, descripción, completed)
- `DELETE /api/v1/tasks/:id` — Eliminar

## 🛠️ Stack

Node.js 20 · Express 4 · TypeScript 5 · Firebase Cloud Functions v2 ·
Firestore · JWT (HS256) · zod · Helmet · Jest · supertest · ESLint · Prettier

## 📄 Licencia

MIT
