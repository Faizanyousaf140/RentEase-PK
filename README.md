# RentEase PK 🏠

> A full-stack rental management platform tailored for the Pakistani real estate market, enabling landlords and tenants to manage properties, agreements, payments, and notices — all in one place.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [PDF Service Setup](#pdf-service-setup)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Properties](#properties)
  - [Agreements](#agreements)
  - [Payments](#payments)
  - [Notices](#notices)
  - [PDF Generation](#pdf-generation)
- [Environment Variables](#environment-variables)
- [User Roles](#user-roles)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**RentEase PK** is a web-based property rental management system designed for the Pakistani market. It connects landlords and tenants on a single platform, streamlining the entire lifecycle of a tenancy — from listing a property and signing a rental agreement, to tracking monthly payments and issuing notices.

The project is composed of three independently deployable services:

| Service | Technology | Default Port |
|---|---|---|
| `rentease-backend` | Django REST Framework | `8000` |
| `rentease-frontend` | Next.js (TypeScript) | `3000` |
| `rentease-pdf` | FastAPI | `8001` |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser / Client                  │
│              Next.js Frontend (:3000)                │
└────────────────────┬────────────────────────────────┘
                     │  REST (JSON) + JWT
          ┌──────────▼──────────┐
          │  Django Backend     │  (:8000)
          │  (DRF + SimpleJWT)  │
          │                     │
          │  • Users            │
          │  • Properties       │
          │  • Agreements       │
          │  • Payments         │
          │  • Notices          │
          └──────────┬──────────┘
                     │  HTTP POST (JSON → PDF)
          ┌──────────▼──────────┐
          │  FastAPI PDF Service │  (:8001)
          │  (ReportLab)        │
          │                     │
          │  • /generate-pdf    │
          └─────────────────────┘
```

The frontend talks directly to the Django backend for all data operations. When a rental agreement PDF is needed, the request is forwarded to the dedicated PDF microservice, which renders and streams the PDF back to the client.

---

## Tech Stack

### Backend (`rentease-backend`)
- **[Django](https://www.djangoproject.com/)** — Web framework
- **[Django REST Framework](https://www.django-rest-framework.org/)** — REST API layer
- **[SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)** — JWT-based authentication
- **[django-cors-headers](https://github.com/adamchainz/django-cors-headers)** — Cross-origin resource sharing
- **SQLite** — Default development database (swap for PostgreSQL in production)

### Frontend (`rentease-frontend`)
- **[Next.js 16](https://nextjs.org/)** — React framework with file-based routing
- **[React 19](https://react.dev/)** — UI library
- **[TypeScript](https://www.typescriptlang.org/)** — Static typing
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Utility-first CSS framework
- **[Axios](https://axios-http.com/)** — HTTP client
- **[jwt-decode](https://github.com/auth0/jwt-decode)** — JWT token decoding on the client

### PDF Microservice (`rentease-pdf`)
- **[FastAPI](https://fastapi.tiangolo.com/)** — High-performance async API framework
- **[Uvicorn](https://www.uvicorn.org/)** — ASGI server
- **[ReportLab](https://www.reportlab.com/)** — PDF generation
- **[Pydantic v2](https://docs.pydantic.dev/)** — Data validation and settings

---

## Features

### For Landlords
- 📋 **Property Management** — Add and manage rental properties with address details
- 📝 **Agreement Creation** — Create formal rental agreements linked to a property and tenant
- 💰 **Payment Tracking** — Record and monitor monthly rent payments (paid / pending)
- 📢 **Notice Issuance** — Send eviction or maintenance notices against an active agreement
- 📄 **PDF Agreement Export** — Generate a professionally formatted rental agreement PDF

### For Tenants
- 🏠 **View Properties** — Browse properties associated with their agreements
- 📅 **Rental Agreements** — View agreement details including rent, start/end dates
- 🧾 **Payment History** — Track monthly payment status
- 🔔 **Notices** — Receive and view notices from the landlord

### Platform
- 🔐 **JWT Authentication** — Secure, stateless auth with 1-day access tokens
- 🛡️ **Role-Based Access** — Separate flows for landlords and tenants
- 🌐 **REST API** — Clean, browsable API via Django REST Framework
- ⚡ **PDF Microservice** — Independently scalable PDF generation with ReportLab

---

## Project Structure

```
RentEase-PK/
├── rentease-backend/          # Django REST API
│   ├── core/                  # Project settings, URLs, WSGI
│   ├── users/                 # Custom User model, registration, auth URLs
│   ├── properties/            # Property model, views, serializers
│   ├── agreements/            # Rental Agreement model, views, serializers
│   ├── payments/              # Payment model, views, serializers
│   ├── notices/               # Notice model, views, serializers
│   ├── manage.py
│   └── db.sqlite3
│
├── rentease-frontend/         # Next.js TypeScript frontend
│   ├── pages/                 # File-based routing (Next.js Pages Router)
│   │   ├── _app.js
│   │   ├── index.js           # Landing / home page
│   │   ├── login.js
│   │   ├── register.js
│   │   └── dashboard/         # Protected dashboard pages
│   │       ├── index.js       # Dashboard home
│   │       ├── properties.js
│   │       ├── agreements.js
│   │       ├── payments.js
│   │       └── notices.js
│   ├── components/            # Reusable UI components
│   │   ├── Navbar.js
│   │   ├── ProtectedRoute.js
│   │   ├── AgreementCard.js
│   │   ├── NoticeCard.js
│   │   └── PaymentTable.js
│   ├── context/               # React context (e.g., auth)
│   ├── services/              # API service functions (Axios)
│   ├── utils/                 # Helper utilities
│   └── package.json
│
└── rentease-pdf/              # FastAPI PDF microservice
    ├── main.py                # FastAPI app, routes, middleware
    ├── models.py              # Pydantic schemas (AgreementRequest)
    ├── pdf_generator.py       # ReportLab PDF generation logic
    └── requirements.txt
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

| Tool | Minimum Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| pip | 23+ |

---

### Backend Setup

```bash
cd rentease-backend

# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers

# 3. Apply migrations
python manage.py migrate

# 4. Create a superuser (optional, for admin panel)
python manage.py createsuperuser

# 5. Start the development server
python manage.py runserver
```

The backend will be available at **http://localhost:8000**.  
The browsable admin panel is at **http://localhost:8000/admin/**.

---

### Frontend Setup

```bash
cd rentease-frontend

# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```

The frontend will be available at **http://localhost:3000**.

Other available scripts:

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

### PDF Service Setup

```bash
cd rentease-pdf

# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

The PDF service will be available at **http://localhost:8001**.  
Interactive API docs (Swagger UI) are at **http://localhost:8001/docs**.

---

## API Reference

All backend API endpoints are prefixed with `http://localhost:8000`.  
Protected endpoints require the `Authorization: Bearer <access_token>` header.

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register/` | Register a new user | ❌ |
| `POST` | `/auth/login/` | Obtain JWT access & refresh tokens | ❌ |
| `POST` | `/auth/refresh/` | Refresh an expired access token | ❌ |

**Register request body:**
```json
{
  "username": "ali_raza",
  "password": "StrongPass123",
  "role": "tenant"
}
```

**Login response:**
```json
{
  "access": "<JWT access token>",
  "refresh": "<JWT refresh token>"
}
```

---

### Properties

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/properties/` | List all properties | ✅ |
| `POST` | `/properties/` | Create a new property | ✅ |
| `GET` | `/properties/{id}/` | Retrieve a property | ✅ |
| `PUT` | `/properties/{id}/` | Update a property | ✅ |
| `DELETE` | `/properties/{id}/` | Delete a property | ✅ |

**Property object:**
```json
{
  "id": 1,
  "owner": 1,
  "title": "3-Bedroom House in DHA",
  "address": "House 12, Block C, DHA Phase 5, Lahore"
}
```

---

### Agreements

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/agreements/` | List all agreements | ✅ |
| `POST` | `/agreements/` | Create a rental agreement | ✅ |
| `GET` | `/agreements/{id}/` | Retrieve an agreement | ✅ |
| `PUT` | `/agreements/{id}/` | Update an agreement | ✅ |
| `DELETE` | `/agreements/{id}/` | Delete an agreement | ✅ |

**Agreement object:**
```json
{
  "id": 1,
  "property": 1,
  "landlord": 2,
  "tenant": 3,
  "rent": 45000,
  "start_date": "2025-01-01",
  "end_date": "2025-12-31"
}
```

---

### Payments

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/payments/` | List all payments | ✅ |
| `POST` | `/payments/` | Record a payment | ✅ |
| `GET` | `/payments/{id}/` | Retrieve a payment | ✅ |
| `PUT` | `/payments/{id}/` | Update a payment | ✅ |
| `DELETE` | `/payments/{id}/` | Delete a payment | ✅ |

**Payment object:**
```json
{
  "id": 1,
  "agreement": 1,
  "amount": 45000,
  "month": "January 2025",
  "status": "paid",
  "created_at": "2025-01-05T10:00:00Z"
}
```

`status` can be `"paid"` or `"pending"`.

---

### Notices

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/notices/` | List all notices | ✅ |
| `POST` | `/notices/` | Create a notice | ✅ |
| `GET` | `/notices/{id}/` | Retrieve a notice | ✅ |
| `PUT` | `/notices/{id}/` | Update a notice | ✅ |
| `DELETE` | `/notices/{id}/` | Delete a notice | ✅ |

**Notice object:**
```json
{
  "id": 1,
  "agreement": 1,
  "type": "maintenance",
  "message": "Plumbing repair scheduled for Saturday.",
  "created_at": "2025-03-15T09:30:00Z"
}
```

`type` can be `"eviction"` or `"maintenance"`.

---

### PDF Generation

Base URL: `http://localhost:8001`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/generate-pdf` | Generate a rental agreement PDF | ❌ |
| `GET` | `/health` | Health check | ❌ |
| `GET` | `/ready` | Readiness check | ❌ |
| `GET` | `/docs` | Swagger UI | ❌ |

**`POST /generate-pdf` request body:**
```json
{
  "landlord_name": "Muhammad Usman Tariq",
  "landlord_cnic": "35202-1234567-1",
  "landlord_contact": "+92-300-1234567",
  "tenant_name": "Ali Raza Khan",
  "tenant_cnic": "35202-7654321-3",
  "tenant_contact": "+92-321-9876543",
  "property_address": "House 12, Block C, DHA Phase 5, Lahore",
  "property_type": "Residential",
  "rent_amount": 45000,
  "security_deposit": 90000,
  "payment_due_day": 1,
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "utilities_included": "Water, Electricity",
  "special_conditions": "No pets allowed."
}
```

The response is a **binary PDF stream** (`Content-Type: application/pdf`) with a `Content-Disposition` header for download.

> **CNIC format:** `XXXXX-XXXXXXX-X` (e.g., `35202-1234567-1`)

---

## Environment Variables

### Backend (`rentease-backend`)

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SECRET_KEY` | `dev-secret-key-change-in-production` | Django secret key — **change in production** |
| `DJANGO_DEBUG` | `true` | Enable/disable debug mode |
| `DJANGO_ALLOWED_HOSTS` | `127.0.0.1,localhost` | Comma-separated list of allowed hosts |

### PDF Service (`rentease-pdf`)

| Variable | Default | Description |
|---|---|---|
| `APP_NAME` | `RentEase PDF Service` | Display name of the service |
| `APP_VERSION` | `1.0.0` | Application version |
| `LOG_LEVEL` | `INFO` | Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |
| `ENABLE_API_DOCS` | `true` | Enable Swagger/ReDoc docs |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated CORS origins |
| `TRUSTED_HOSTS` | `127.0.0.1,localhost` | Comma-separated trusted hosts |

---

## User Roles

RentEase PK supports two user roles, set at registration time:

| Role | `role` value | Capabilities |
|---|---|---|
| **Landlord** | `landlord` | List/manage properties, create agreements, record payments, issue notices, generate PDFs |
| **Tenant** | `tenant` | View properties and agreements, view payment history, view received notices |

---

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m 'feat: add your feature'`
4. **Push** to your fork: `git push origin feature/your-feature-name`
5. **Open** a Pull Request describing your changes

Please ensure your code follows the existing style and that all services start without errors before submitting.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<div align="center">Built with ❤️ for Pakistan's rental market</div>
