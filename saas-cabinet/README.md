# SaaS Cabinet Juridique

Monorepo with:
- `backend/` (Node.js + Express + PostgreSQL)
- `frontend/` (React)

Functional reference:
- `FONCTIONNALITES.md`

## 1) Prerequisites

- Node.js 18+
- PostgreSQL 13+

## 2) Backend setup

```bash
cd backend
npm install
```

Create or update `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saas_cabinet
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:3000
```

Start backend:

```bash
npm run dev
```

On startup, tables are created automatically if they do not exist:
- `organizations`
- `users`
- `clients`
- `cases`
- `payments`
- `legal_services`
- `procedure_requests`

Health check:
- `GET http://localhost:5000/api/health`

## 3) Frontend setup

```bash
cd frontend
npm install
```

Create or update `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start frontend:

```bash
npm start
```

Frontend URL:
- `http://localhost:3000`

## 4) Main API routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Organization
- `GET /api/organizations/themes`
- `GET /api/organizations/me`
- `PATCH /api/organizations/me`
- `POST /api/organizations/me/logo`

### Clients
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:id`
- `PATCH /api/clients/:id`
- `DELETE /api/clients/:id`

### Cases
- `GET /api/cases`
- `POST /api/cases`
- `GET /api/cases/:id`
- `PATCH /api/cases/:id`
- `DELETE /api/cases/:id`

### Payments
- `GET /api/payments`
- `GET /api/payments/summary`
- `GET /api/payments/:id`
- `POST /api/payments`
- `PATCH /api/payments/:id`
- `DELETE /api/payments/:id`

### Services
- `GET /api/services`
- `POST /api/services`
- `GET /api/services/:id`
- `PATCH /api/services/:id`
- `DELETE /api/services/:id`

### Procedures
- `GET /api/procedures`
- `POST /api/procedures`
- `GET /api/procedures/:id`
- `PATCH /api/procedures/:id`

## 5) Notes

- All protected routes require `Authorization: Bearer <token>`.
- Multi-tenancy is enforced by `organization_id` from the JWT payload.
- Uploaded files are stored in `backend/uploads/`.
