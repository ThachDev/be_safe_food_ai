# Be Safe Food AI (Backend)

Welcome to the backend repository for **Be Safe Food AI**. This Node.js & Express application serves as the core backend, providing APIs for food safety scanning, news processing, user authentication, and AI-driven conversational capabilities.

## 🚀 Tech Stack

- **Framework**: Node.js, Express.js
- **Database**: MySQL, Sequelize (ORM)
- **Authentication**: Firebase Admin SDK
- **AI Integrations**: Groq SDK, Google Generative AI
- **File Storage**: Cloudinary
- **Mail Service**: Nodemailer (OTP / Email Verification)
- **Utilities**: Axios, Cheerio/jsdom, RSS Parser, Dotenv

## 📂 Project Structure

```
├── src
│   ├── controllers    # Request handlers
│   ├── models         # Sequelize database models
│   ├── routes         # Express API routes
│   ├── services       # Core business logic and external service integrations
│   ├── app.js         # Express app setup
│   └── server.js      # Server entry point
├── .env.example       # Example environment variables
├── package.json       # Project dependencies and scripts
└── README.md          # Project documentation
```

## 🛠 Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+ recommended)
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
   Copy the example environment file and update it with your own credentials:
   ```bash
   cp .env.example .env
   ```
   *Make sure to fill in your Database credentials, Firebase Admin keys, Cloudinary tokens, Groq API key, and SMTP info in the `.env` file.*

## 🚀 Running the Application

### Development Mode
To run the server in development mode with hot-reloading (using nodemon):
```bash
npm run dev
```

### Production Mode
To start the server normally:
```bash
npm start
```

The server will start on the port specified in your `.env` file (default is `5001`).

## 📜 License

This project is licensed under the ISC License.
