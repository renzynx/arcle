# 📚 Arcle

Arcle is a modern, self-hosted manga and comic reader platform. Built with a focus on speed, scalability, and ease of deployment, it uses a microservices architecture powered by **Bun**, **Hono**, and **Next.js**.

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=flat&logo=bun&logoColor=white)](https://bun.sh)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat&logo=turborepo&logoColor=white)](https://turbo.build/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white)](https://hono.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?style=flat&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [CLI Tools](#cli-tools)
- [Production Deployment](#-production-deployment)
  - [Docker Compose](#docker-compose)
  - [Environment Variables](#environment-variables)
- [Search Providers](#-search-providers)
- [Security](#-security)
- [Contributing](#-contributing)

---

## 🌟 Overview

Arcle is designed as a monorepo containing multiple applications and services that work together to provide a seamless reading experience.

### Apps (Next.js)
- **`apps/web`**: The main reader frontend. Optimized for reading on any device. (Port 8000 in Docker, 3000 locally)
- **`apps/admin`**: Administrative dashboard for managing the catalog, users, and system settings. (Port 9000 in Docker, 3000 locally)

### Services (Hono/Bun)
- **`services/gateway`**: Central API entry point. Handles rate limiting, CORS, and maintenance modes. (Port 3000)
- **`services/auth`**: Authentication and identity management using `better-auth`. (Port 4000)
- **`services/users`**: Manages user libraries, reading history, ratings, and account settings. (Port 5000)
- **`services/catalog`**: The heart of the platform. Manages series, chapters, pages, and metadata. (Port 6000)
- **`services/media`**: Handles image uploads and serving for covers and manga pages. (Port 7000)
- **`services/worker`**: Background job processor for image optimization (using `sharp`) and cleanup tasks.

### Packages (Shared)
- **`packages/api-client`**: Typed API client for inter-service and frontend communication.
- **`packages/auth-client/server`**: Shared authentication logic and middleware.
- **`packages/database`**: Shared Drizzle schema definitions.
- **`packages/ui`**: A robust UI component library based on `shadcn/ui`.
- **`packages/cache`**: Redis caching utilities.
- **`packages/events`**: Redis pub/sub for inter-service communication.
- **`packages/queue`**: BullMQ-based job queuing.
- **`packages/search`**: Search provider abstraction (PostgreSQL or Typesense).

---

## ✨ Features

- **Two-Factor Authentication (2FA)**: Users can enable TOTP-based 2FA with authenticator apps. Backup codes are supported for account recovery.
- **Maintenance Mode**: Admins can enable maintenance mode to block access to the web app while keeping the admin dashboard accessible.
- **Reading History & Library**: Track reading progress and manage personal manga libraries.
- **Full-Text Search**: Search across all series with PostgreSQL or Typesense.
- **Image Optimization**: Automatic image processing and optimization via Sharp.
- **Mobile-First Design**: Responsive reading experience optimized for all devices.

---

## 🏗 Architecture

Arcle follows a microservices architecture to ensure high availability and scalability. All requests from clients go through the **Gateway**, which proxies them to the appropriate service. Services communicate asynchronously via **Redis Pub/Sub** for event-driven updates.

```mermaid
graph TD
    User([User]) --> Web[Web Frontend]
    Admin([Admin]) --> Dashboard[Admin Dashboard]
    
    Web --> Gateway
    Dashboard --> Gateway
    
    Gateway --> Auth[Auth Service]
    Gateway --> Users[Users Service]
    Gateway --> Catalog[Catalog Service]
    Gateway --> Media[Media Service]
    
    Auth --- Postgres[(PostgreSQL)]
    Users --- Postgres
    Catalog --- Postgres
    
    Catalog --- Redis[(Redis)]
    Media --- Storage[(Local Storage)]
    
    Catalog -- Events --> Worker[Worker Service]
    Worker -- Image Processing --> Storage
```

---

## 🛠 Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Monorepo Management**: [Turborepo](https://turbo.build/)
- **Frontend**: [Next.js 16](https://nextjs.org/), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend Services**: [Hono](https://hono.dev/)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Cache & Message Broker**: [Redis 7](https://redis.io/)
- **Authentication**: [better-auth](https://www.better-auth.com/)
- **Job Queue**: [BullMQ](https://docs.bullmq.io/)
- **Search**: PostgreSQL Full-Text Search or [Typesense](https://typesense.org/)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/)

---

## 📂 Project Structure

```text
arcle/
├── apps/
│   ├── admin/          # Admin dashboard (Next.js)
│   └── web/            # Reader frontend (Next.js)
├── packages/           # Shared packages
│   ├── ui/             # Shared UI components (shadcn/ui)
│   ├── database/       # Shared Drizzle schemas
│   └── ...             # Other shared utilities
├── services/           # Backend microservices
│   ├── gateway/        # API Gateway
│   ├── auth/           # Auth service
│   ├── catalog/        # Catalog management
│   ├── users/          # User management
│   ├── media/          # Image serving/uploads
│   └── worker/         # Background processing
├── docker/             # Docker configuration files
├── Dockerfile.*        # Optimized Dockerfiles for services/apps
├── docker-compose.yml  # Full stack orchestration
└── package.json        # Root package definition
```

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.5
- [Docker](https://www.docker.com/) & Docker Compose
- Node.js (for optional tooling)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/renzynx/arcle.git
   cd arcle
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Start infrastructure**:
   ```bash
   docker compose up postgres redis -d
   ```

4. **Prepare databases**:
   ```bash
   turbo db:push
   ```

5. **Create an admin user**:
   ```bash
   cd services/auth
   bun run cli admin:create -e admin@example.com -p your-password
   ```

6. **Start all services**:
   ```bash
   turbo dev
   ```

### CLI Tools

The Auth service includes a CLI for managing administrative users:

```bash
# Create an admin
bun run services/auth/src/cli.ts admin:create --email <email> --password <password>

# List all admins
bun run services/auth/src/cli.ts admin:list
```

**Using CLI in Docker:**

```bash
# Create an admin inside the auth container
docker compose exec auth bun run cli admin:create --email <email> --password <password>

# List all admins
docker compose exec auth bun run cli admin:list
```

---

## 🐳 Production Deployment

Arcle is designed to be easily deployed using Docker.

### Docker Compose

Deploy the full stack with a single command:

```bash
docker compose up -d
```

This will start all backend services, both frontend applications, and the required infrastructure (PostgreSQL, Redis). Databases are automatically initialized via `docker/postgres/init-databases.sh`.

### Environment Variables

For production, create a `.env` file at the root:

```env
BETTER_AUTH_SECRET=your-production-secret
NEXT_PUBLIC_GATEWAY_URL=https://api.your-domain.com
TRUSTED_ORIGINS=https://your-domain.com,https://admin.your-domain.com
SEARCH_PROVIDER=postgres
```

| Variable | Description | Default |
|----------|-------------|---------|
| `BETTER_AUTH_SECRET` | Secret key for auth token signing | `change-me-in-production` |
| `NEXT_PUBLIC_GATEWAY_URL` | Public URL of the API gateway (also used for auth) | `http://localhost:3000` |
| `TRUSTED_ORIGINS` | Comma-separated list of allowed origins for auth (web & admin URLs) | `http://localhost:8000,http://localhost:9000` |
| `SEARCH_PROVIDER` | Search backend (`postgres` or `typesense`) | `postgres` |
| `ADMIN_ORIGIN` | Admin dashboard URL (used to bypass maintenance mode) | `http://localhost:9000` |

### Volumes

- `postgres_data`: Persistent database storage.
- `redis_data`: Persistent cache and queue data.
- `media_uploads`: All uploaded images (covers, pages, avatars).

### Scaling with Replicas (Optional)

For high-traffic deployments, use the scaling override to run multiple replicas behind nginx:

```bash
docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

This adds:
- **nginx** load balancer on ports 80 (API), 8000 (web), 9000 (admin)
- Multiple replicas for gateway, catalog, media, users, web, and admin

Configure replica counts via environment variables:

```env
GATEWAY_REPLICAS=3
CATALOG_REPLICAS=3
MEDIA_REPLICAS=2
USERS_REPLICAS=2
WEB_REPLICAS=2
ADMIN_REPLICAS=2
```

---

## 🔍 Search Providers

Arcle supports multiple search backends:

1. **PostgreSQL (Default)**: Uses built-in Full-Text Search. No additional setup required.
2. **Typesense**: High-performance search engine.
   - To enable, start Docker with the typesense profile: `docker compose --profile typesense up -d`
   - Set `SEARCH_PROVIDER=typesense` in your environment variables.

---

## ⚡ Turbo Remote Cache

This project uses [Turborepo Remote Cache](https://turbo.build/repo/docs/core-concepts/remote-caching) for faster CI/CD builds.

### Setup for CI (GitHub Actions)

1. Create a Vercel account and link it to Turborepo
2. Generate a token at [vercel.com/account/tokens](https://vercel.com/account/tokens)
3. Add the following to your GitHub repository:
   - **Secret**: `TURBO_TOKEN` - Your Vercel token
   - **Variable**: `TURBO_TEAM` - Your Vercel team slug (or username)

### Setup for Local Development (Optional)

```bash
npx turbo login
npx turbo link
```

This enables cache sharing between CI and local development.

---

## 🔐 Security

### Two-Factor Authentication
- Users can enable 2FA from their account settings
- Supports TOTP (Time-based One-Time Password) with any authenticator app (Google Authenticator, Authy, etc.)
- Backup codes are generated for account recovery if the authenticator device is lost
- "Trust this device" option to skip 2FA on trusted devices for 30 days

### Maintenance Mode
- Admins can enable maintenance mode from the admin dashboard settings
- When enabled, the web app shows a maintenance page to users
- Admin dashboard remains accessible via the `ADMIN_ORIGIN` setting
- Useful for performing updates or database migrations

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
