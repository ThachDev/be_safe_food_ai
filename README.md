# Be Safe Food AI (Backend Hub)

[![Runtime](https://img.shields.io/badge/Runtime-Cloudflare%20Workers-orange.svg?style=flat-square)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-v4-blueviolet.svg?style=flat-square)](https://hono.dev/)
[![Database](https://img.shields.io/badge/D1-SQLite-blue.svg?style=flat-square)](https://developers.cloudflare.com/d1/)
[![Architecture](https://img.shields.io/badge/Architecture-Clean--Arch-purple.svg?style=flat-square)](#-architecture--design-patterns)
[![License](https://img.shields.io/badge/license-ISC-green.svg?style=flat-square)](LICENSE)

Welcome to the central API server for **Be Safe Food AI** — an intelligent, serverless backend ecosystem powering real-time food safety scanning, personalized dietary advice, conversational AI, and critical food recall warnings.

This codebase is crafted using **100% TypeScript** and is optimized to run on **Cloudflare Workers** using the **Hono** framework for high-scale, ultra-low latency, and modern serverless execution.

---

## 🌟 Key Capabilities

- 🔍 **AI Ingredient Analysis**: Seamless scanning of food labels to detect harmful additives, calculate safety ratings, and flag health hazards.
- 💬 **Conversational Health Assistant**: Custom AI-driven chat providing advice personalized to user profiles (allergies, health goals, and medical conditions).
- ⚠️ **Food Recalls & Push Alerts**: Auto-aggregates global/local food safety warnings, parses source URLs, tracks matching scan history, and broadcasts instant push alerts via Firebase Cloud Messaging (FCM).
- 🔐 **Secure Authentication**: Integration with Firebase Identity Provider, featuring secure OTP verification via Nodemailer and custom signed tokens using standard Web Crypto APIs.
- ☁️ **Cloud Storage**: Fast, reliable media and scan image hosting via Cloudflare R2 bucket.

---

## ⚙️ Tech Stack & Integrations

| Layer / Integration               | Technology Used                                                                        |
| :-------------------------------- | :------------------------------------------------------------------------------------- |
| **Runtime & Language**            | Cloudflare Workers, TypeScript (Target: ES2022)                                        |
| **Server Framework**              | Hono (v4.x) with CORS and built-in routing                                             |
| **Database & ORM**                | Cloudflare D1 (Serverless SQLite)                                                      |
| **Cache & OTP States**            | Cloudflare KV Namespace (with native TTL expiration)                                   |
| **Identity & Push Notifications** | Web Crypto signed assertions (RS256 JWTs), Google OAuth REST API, FCM HTTP v1 REST API |
| **AI Assistants**                 | Groq SDK, Google Generative AI (Gemini SDK)                                            |
| **Media Delivery**                | Cloudflare R2 Storage Service (public URL image serving route)                         |
| **Integrations & Scrapers**       | Axios, JSDOM, Mozilla Readability, RSS Parser, Google News URL Decoder                 |

---

## 🏗 Architecture & Design Patterns

The project follows a **4-Layer Clean Architecture** enforcing strict dependency rules: _the inner layers do not know anything about the outer layers_.

```mermaid
graph TD
    Client[Client Browser / Mobile App]
    subgraph Web Interfaces
        Route[Hono Router: src/routes/index.ts]
        Mid[Middlewares: src/interfaces/web/middlewares]
    end
    subgraph Core Application Business Logic
        UC[Use Cases: src/application/use_cases]
        ServInt[Service Interfaces: src/application/interfaces]
    end
    subgraph Enterprise Domain Layer
        DomEnt[Domain Entities: src/domain/entities]
        RepoInt[Repository Interfaces: src/domain/repositories]
    end
    subgraph Infrastructure Layer
        D1Rep[D1 Repositories: src/infrastructure/repositories]
        D1Schema[D1 Tables: migrations/schema.sql]
        ExtServ[External Services: R2, KV, Firebase Web Crypto, Groq, Mail]
    end

    Client --> Route
    Route --> Mid
    Mid --> UC
    UC --> DomEnt
    UC --> RepoInt
    UC --> ServInt
    RepoInt -.-> D1Rep
    ServInt -.-> ExtServ
    D1Rep --> D1Schema
```

### Flow of Execution

1.  **Request Input**: The client request passes through the main entry point `src/index.ts` to `src/routes/index.ts`.
2.  **Routing & Middleware**: Request is filtered by routing path and Hono middlewares (CORS, auth).
3.  **UseCase Orchestration**: The route handler retrieves instanced use cases from the request-scoped container `src/di/container.ts` and invokes them.
4.  **Data & Third-Party Execution**: Concrete implementations in `src/infrastructure` map inputs/outputs from D1, KV, R2, or third-party APIs back to Domain entities.

---

## 📂 Project Structure

```
be_safe_food_ai/
├── migrations/
│   └── schema.sql                 # D1 Database SQLite schema configuration
├── secrets/                       # Secure certificates & Firebase credentials keys
├── src/
│   ├── index.ts                   # Main Hono entrypoint (CORS, Logger, Error handlers)
│   ├── di/
│   │   └── container.ts           # Request-scoped Dependency injection factory function
│   ├── domain/                    # Enterprise Core Domain logic (Independent, zero external dependencies)
│   │   ├── entities/              # Business schemas and typescript types
│   │   ├── errors/                # Unified custom domain errors
│   │   └── repositories/          # Interface signatures for database operations
│   ├── application/               # Core application logic
│   │   ├── interfaces/            # Service adapters signatures (AI, Mail, R2 storage, etc.)
│   │   └── use_cases/             # Executable business rules (one action class per file)
│   ├── infrastructure/            # Technical adapters and database configuration
│   │   ├── repositories/          # Concrete D1/KV repository implementations
│   │   └── services/              # Integrations (Firebase Web Crypto, R2 storage, Groq, Nodemailer)
│   ├── interfaces/                # Web entry point
│   │   └── web/
│   │       └── middlewares/       # Hono Middleware handlers (JWK verification, auth check)
│   ├── routes/
│   │   └── index.ts               # Primary routing registry for mounting paths to `/api/v1`
│   ├── shared/                    # Constants, common statuses, and utility helpers
│   └── types/                     # Extra ambient declarations files (*.d.ts)
├── models.json                    # Configuration detailing compatible AI engine models
├── tsconfig.json                  # Compiler guidelines for TypeScript
├── package.json                   # Main scripts and dependencies
├── wrangler.toml                  # Cloudflare Worker resources binding configuration
└── AI_GUIDELINES.md               # Onboarding and development guidelines for AI assistants
```

---

## 🛠 Setup & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- Cloudflare account logged in via Wrangler (`npx wrangler login`)

### 1. Clone & Dependencies Installation

```bash
git clone https://github.com/ThachDev/be_safe_food_ai.git
cd be_safe_food_ai
npm install
```

### 2. Environment Setup

Create a `.dev.vars` file in the root folder containing the following local secrets:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GROQ_API_KEY=your-groq-key
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=your-from-email
SMTP_FROM_NAME=Safe Food AI
CRON_SYNC_TOKEN=your-cron-secret-token
```

### 3. Database Initialization & Schema Migrations

Run migrations locally to set up the SQLite database emulation:

```bash
npx wrangler d1 execute safe-food-ai-db --file=migrations/schema.sql --local
```

To run migrations on the production Cloudflare database:

```bash
npx wrangler d1 execute safe-food-ai-db --file=migrations/schema.sql --remote
```

---

## 🚀 Running the Application

### Development Mode (Local Emulation)

Runs the Hono app locally with live-reloads, binding local D1, KV, and R2 emulation:

```bash
npm run dev
```

### Deploying to Cloudflare Workers

Publishes the backend directly to your Cloudflare account:

```bash
npm run deploy
```

---

## 🔗 Main API Endpoint Namespaces

All functional endpoints are mounted under `/api/v1`. Below is an overview of the namespaces:

| Route namespace | Mounting Path     | Primary Purpose                                         |
| :-------------- | :---------------- | :------------------------------------------------------ |
| **Auth**        | `/api/v1/auth`    | Firebase login, OTP issuance, signup flows              |
| **Users**       | `/api/v1/users`   | Retrieve and update account-level metrics               |
| **Chat**        | `/api/v1/chat`    | AI dialog queries and chat history listing              |
| **News**        | `/api/v1/news`    | Global food recalls feed, cron alerts syncing           |
| **Scans**       | `/api/v1/scans`   | Image uploads, ingredient matching logic, safety rating |
| **Profile**     | `/api/v1/profile` | Update dietary types, allergies, health conditions      |
| **App**         | `/api/v1/app`     | Version status checks and metadata configurations       |
| **Health**      | `/api/v1/health`  | Service status monitoring                               |

---

## 📜 License

This project is licensed under the **ISC License**. For details, see the configurations inside `package.json`.
