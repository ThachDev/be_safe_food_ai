# Be Safe Food AI (Backend)

Welcome to the backend repository for **Be Safe Food AI**. This application serves as the core backend, providing APIs for food safety scanning, news processing, user authentication, and AI-driven conversational capabilities.

The project has recently been fully migrated to **TypeScript 100%** and refactored following **Clean Architecture** principles to guarantee enterprise-level scalability, maintainability, and robust type safety.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript (ES Modules)
- **Framework**: Express.js
- **Architecture**: Clean Architecture (Domain, Application, Infrastructure, Interfaces)
- **Dependency Injection**: `tsyringe`
- **Database**: MySQL, Sequelize (ORM)
- **Authentication**: Firebase Admin SDK
- **AI Integrations**: Groq SDK, Google Generative AI
- **File Storage**: Cloudinary
- **Mail Service**: Nodemailer (OTP / Email Verification)
- **Utilities**: Axios, JSDOM, Mozilla Readability, RSS Parser

## 📂 Project Structure (Clean Architecture)

```
├── src
│   ├── domain         # Core Entities & Repository Interfaces (No external dependencies)
│   ├── application    # Use Cases & Service Interfaces (Business Logic)
│   ├── infrastructure # DB Models, Repositories Implementation, Third-party Services
│   ├── interfaces     # Web (Controllers, Routes, Middlewares)
│   ├── shared         # Constants, Utils, Common Types
│   ├── di             # Dependency Injection Container setup
│   ├── app.ts         # Express App Initialization
│   └── server.ts      # Server Entry Point
├── package.json       # Project dependencies & scripts
├── AI_GUIDELINES.md   # Guidelines for AI Assistants working on this repo
└── README.md          # Project documentation
```

## 🛠 Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [MySQL](https://www.mysql.com/) database

## ⚙️ Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ThachDev/be_safe_food_ai.git
   cd be_safe_food_ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory (you can copy from a team member or example file) and fill in your Database credentials, Firebase Admin keys, Cloudinary tokens, Groq API key, and SMTP info.

## 🚀 Running the Application

### Development Mode (Hot-reloading)
To run the server in development mode, we use `tsx` which directly executes TypeScript with ES Module support on the fly.
```bash
npm run dev
```

### Database Migration
If you need to manually run the schema synchronization script:
```bash
npm run migrate
```

### Production Build & Run
To compile the TypeScript code to plain JavaScript and run it in a production environment:
```bash
npm run build
npm start
```
*(The build output will be stored in the `dist/` directory).*

The server will start on the port specified in your `.env` file (default is `5001`).

## 📜 License

This project is licensed under the ISC License.
