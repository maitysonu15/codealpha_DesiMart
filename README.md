# 🛒 DesiMart - Fresh & Fast Grocery Fullstack App

Complete fullstack e-commerce web application with React 19 UI, Vite, and Node.js Express backend API with real OTP email & SMS capabilities.

## 📁 Project Structure

```
DesiMart/
├── backend/                  # Node.js Express API Server
│   ├── .env                  # Real Email & SMS credentials
│   ├── .env.example          # Sample environment configuration
│   ├── package.json          # Backend dependencies
│   └── server.js             # Express OTP API Endpoint
│
├── frontend/                 # React 19 + Vite Frontend UI
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite config
│   ├── index.html            # Entry HTML
│   └── src/                  # Components, Pages, Context & Utilities
│
├── package.json              # Fullstack runner scripts
└── README.md                 # Project documentation
```

## 🚀 Quick Start Guide

### 1. Start Both Frontend & Backend Concurrently
From the root directory, run:
```bash
npm run dev
```

### 2. Run Frontend Only
```bash
cd frontend
npm run dev
```
Frontend runs at: `http://localhost:5173/`

### 3. Run Backend Only
```bash
cd backend
npm run start
```
Backend runs at: `http://localhost:5000/`

---

## 🔑 Email & SMS Configuration

Open `backend/.env` and enter your credentials:

```env
EMAIL_USER=your_email@domain.com
EMAIL_PASS=your_authentication_password
FAST2SMS_API_KEY=your_fast2sms_key
```
