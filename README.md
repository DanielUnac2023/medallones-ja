# CLUBESTJA — Control de Requisitos y Progreso

Panel de gestión para aspirantes e instructores de un club. Los aspirantes ven sus
requisitos y registran su progreso (reps o segundos); los instructores administran el
catálogo de requisitos/secciones y registran los logros oficiales (fecha + medición).

## Stack

- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS (diseño "Kinetic Glass", ver `DESIGN.md`)
- **Backend**: NestJS (API REST) desplegado en Railway / Render / Fly.io
- **Base de datos**: Firebase Firestore
- **Auth**: Firebase Auth (email/password) + ID token verificado por NestJS
- **Hosting frontend**: GitHub Pages

## Estructura

```
frontend/   # SPA React (GitHub Pages)
backend/    # API NestJS (Railway/Render/Fly.io)
DESIGN.md   # Sistema de diseño
code.html   # Mockup estático de referencia visual
```

## Configuración inicial

### 1. Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Activos **Authentication** (proveedor Email/Password) y **Firestore**.
3. En Configuración del proyecto → Cuentas de servicio → genera una **private key** JSON.
4. Codifica esa JSON en base64:
   - Linux/Mac: `base64 -w0 serviceAccount.json`
   - Windows (PowerShell): `[Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccount.json"))`
5. Copia `backend/.env.example` a `backend/.env` y pega el base64 en `FIREBASE_SERVICE_ACCOUNT_BASE64`.
6. Copia `frontend/.env.example` a `frontend/.env` y rellena `VITE_API_URL=http://localhost:3000/api`
   y las variables `VITE_FIREBASE_*` de la config web de tu proyecto.

### 2. Reglas de Firestore

Todo el acceso va por el backend (Admin SDK), así que las reglas pueden ser estrictas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Seed de datos demo

```bash
cd backend
npm install
cp .env.example .env   # ya configurado arriba
npm run seed           # crea instructor@demo.com / aspirante@demo.com (Demo123456)
```

## Desarrollo local

```bash
# Terminal 1 — backend (puerto 3000)
cd backend
npm install
npm run start:dev

# Terminal 2 — frontend (puerto 5173)
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 y entra con las credenciales del seed.

## Deploy

### Frontend (automático)

1. Sube el repo a GitHub.
2. En el repo: **Settings → Pages → Source: GitHub Actions**.
3. Añade los secrets del frontend en **Settings → Secrets and variables → Actions**:
   `VITE_API_URL`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
   `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
   `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
4. Cada push a `main` construye y publica automáticamente.

### Backend (manual, una vez)

Despliega `backend/` en Railway/Render/Fly.io con estas variables de entorno:
`FIREBASE_SERVICE_ACCOUNT_BASE64`, `CORS_ORIGINS` (URL de GitHub Pages), `PORT`.

## Modelo de datos (Firestore)

| Colección | Campos |
|---|---|
| `/asociaciones` | nombre_asoc |
| `/distritos` | nombre_dist, asoc_id |
| `/clubes` | nombre_club, distrito_id |
| `/roles` | rol |
| `/tipo_medallon` | tipo_medallon |
| `/secciones` | seccion, medallon_id |
| `/requisitos` | seccion_id, requisito, referencia, unidad (reps\|segundos) |
| `/usuarios` | nombre, email, telefono, rol, club_id |
| `/aspirante_club` | club_id |
| `/pruebas` | aspirante_id, requisito_id, resultado, valor, fecha_logrado, registrado_por |
| `/progreso_aspirante` | aspirante_id, requisito_id, valor_registrado, fecha_actualizado |

## Flujos clave

- **Instructor** → `/inicio` (dashboard del club) → `/aspirantes` → detalle → **Registrar prueba**.
- **Aspirante** → `/mis-requisitos` (campo de progreso autoguardado) → `/mis-logros`.
- Multi-tenant: el instructor solo ve aspirantes de su club (validado en el backend).