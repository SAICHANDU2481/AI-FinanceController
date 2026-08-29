# ⚡ AI Finance Controller — Autonomous Fintech Intelligence Platform

![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/ORM-Prisma%20(PostgreSQL%20%2F%20SQLite)-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Razorpay](https://img.shields.io/badge/Payments-Razorpay%20Test%20Mode-0C2340?style=for-the-badge&logo=razorpay&logoColor=white)
![AI](https://img.shields.io/badge/AI-Grounded%20Fintech%20LLM-6366F1?style=for-the-badge)

**AI Finance Controller** is a next-generation autonomous fintech platform built to give users total control over their financial health, cash flow projections, and spending discipline. Featuring zero-hallucination AI advice grounded directly in real database transactions, automated anomaly detection, recurring subscription detection, and complete Razorpay Test Mode checkout with HMAC SHA-256 verification.

---

## ✨ Core Features

* **📊 Cockpit Dashboard**: Real-time Net Liquid Balance, Monthly Inflow/Outflow, Net Savings Rate, 6-Month Cash Flow chart, and Category Expense Donut.
* **🛡️ Financial Health Score (0-100)**: Multi-factor gauge evaluating Savings Rate, Spending Velocity, Budget Discipline, and Emergency Runway.
* **🤖 FinAdvisor AI**: Conversational wealth advisor with live database context injection.
  * *"Where did I spend the most?"*
  * *"Can I afford ₹5,000 this week?"*
  * *"Why did my expenses surge?"*
  * *"How much can I save next month?"*
* **🔮 30-Day Predictive Cash Flow**: Cumulative daily expense forecast with 90% confidence corridor based on historical seasonality and upcoming recurring debits.
* **⚠️ AI Anomaly Radar**: Statistical moving Z-score outlier detection ($>2.2\sigma$), duplicate charge flags, and high-value outflow monitors.
* **📸 Smart Receipt OCR Scanner**: Multi-modal simulated OCR extracting merchant, dates, tax, and itemized line items into the ledger.
* **🔁 Recurring Bills & Subscription Detector**: Automated 30-day cadence monitor for Netflix, Spotify, Gym, Rent, SIPs, and cloud services with income burden metrics.
* **🎯 Savings Goals Vault**: Milestone tracking with automated deposits and celebratory confetti upon completion.
* **💳 Razorpay Test Mode Gateway**: End-to-end checkout with order generation, HMAC SHA-256 signature verification, webhooks, and billing audit logs.
* **👑 Admin Telemetry & Cockpit**: Superadmin controls for platform GMV, user role management, system diagnostics, and payment auditing.
* **🎨 Ultra-Premium Dark Aesthetic**: Obsidian black foundation with layered atmospheric glow orbs, luminous accent beams, and frosted glassmorphic cards.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion, Canvas Confetti, Axios.
* **Backend**: Node.js, Express.js, Prisma ORM, JWT, Bcryptjs, Helmet, Express Rate Limit, Morgan.
* **Database**: Prisma ORM with SQLite (zero-friction local execution) and PostgreSQL production readiness.
* **Payments**: Razorpay Test Mode (`orders.create`, `crypto` HMAC verification).
* **AI Engine**: Google Gemini API integration with local deterministic DB-grounded reasoning fallback.

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/SAICHANDU2481/AI-FinanceController.git
cd AI-FinanceController
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` to `server/.env` and `client/.env`:
```bash
# Server Configuration (server/.env)
PORT=5000
DATABASE_URL="file:./dev.db" # or postgresql://postgres:password@localhost:5432/aifinance
JWT_SECRET="super_secret_fintech_jwt_token_key_998877"
RAZORPAY_KEY_ID="rzp_test_51MockFinanceKey"
RAZORPAY_KEY_SECRET="mock_secret_key_fintech_12345"
GEMINI_API_KEY="" # Optional: Google Gemini API key
CLIENT_URL="http://localhost:5173"

# Client Configuration (client/.env)
VITE_API_BASE_URL="http://localhost:5000/api"
VITE_RAZORPAY_KEY_ID="rzp_test_51MockFinanceKey"
```

### 3. Initialize & Seed Database
```bash
cd server
npx prisma generate
npx prisma db push
node prisma/seed.js
cd ..
```

### 4. Run Development Servers
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000/api`
* **Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Demo Accounts (1-Click Login)

* **Demo User (Alex Mercer - Pro Tier)**: `alex.fintech@aifinance.io` / `demo12345`
* **Demo Admin (Chief Risk Officer)**: `admin@aifinance.io` / `admin12345`

---

## 📜 License
MIT License. Built for Autonomous Fintech Intelligence Demonstration.
