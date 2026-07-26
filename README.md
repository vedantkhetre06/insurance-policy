# 🛡️ InsureHub — Insurance Policy Management System

A full-stack Insurance Policy Management mini-project built with **React** (frontend) and **Node.js/Express** (backend).

---

## 📁 Project Structure

```
insurance-app/
├── backend/                    # Node.js + Express API
│   ├── server.js               # Main server (routes + premium logic)
│   └── package.json
│
└── frontend/                   # React Application
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js              # All components in one file
    │   └── index.js
    └── package.json
```

---

## ✨ Features

### 📊 Dashboard
- Total policies, premium revenue, claims stats
- Policies by type (Health, Life, Vehicle, Property)
- Expiring-soon alerts
- Quick action buttons

### 📋 Policy Management (CRUD)
- Create policies with type-specific fields
- Filter by type, status, search by name/email
- View full policy detail page
- Edit and delete policies
- Real-time premium preview while filling form

### 🧮 Premium Calculator
- Instant premium calculation for all policy types
- Detailed rating factor breakdown
- Support for annual / quarterly / monthly frequencies

### 📄 Claims Management
- File new claims against active policies
- Approve or reject pending claims
- Filter by status (pending / approved / rejected)

---

## 🏗️ Policy Types & Premium Logic

### 🏥 Health Insurance
- Base rate: 2% of sum assured
- Age multiplier: 1.0× (<30) → 2.2× (60+)
- Smoker loading: +50%
- Family size: +25% per additional member
- Pre-existing conditions: +40%

### ❤️ Life Insurance
- Base rate: 0.8% of sum assured
- Age multiplier: 1.0× (<30) → 2.5× (50+)
- Smoker loading: +60%
- Term multiplier: adjusts for policy length

### 🚗 Vehicle Insurance
- Base rate: 2.5% of vehicle value
- Car: 1.0×, Bike: 0.6×, Truck: 1.4×
- Age of vehicle: +5% per year

### 🏠 Property Insurance
- Base rate: 0.5% of property value
- Commercial: +50%
- Area multiplier based on sq ft

### Payment Frequency
- Annual: no surcharge
- Quarterly: +2%
- Monthly: +5%

---

## 🚀 How to Run

### Backend
```bash
cd backend
npm install
node server.js
# Server runs at http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm start
# App runs at http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard | Dashboard statistics |
| GET | /api/policies | List all policies (filter: type, status, search) |
| GET | /api/policies/:id | Get single policy |
| POST | /api/policies | Create new policy |
| PUT | /api/policies/:id | Update policy |
| DELETE | /api/policies/:id | Delete policy |
| POST | /api/calculate-premium | Calculate premium preview |
| GET | /api/claims | List all claims |
| POST | /api/claims | File a new claim |
| PUT | /api/claims/:id | Update claim status |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, CSS-in-JS |
| Backend | Node.js, Express.js |
| Storage | In-memory (no database needed) |
| HTTP | REST API with CORS |

---

## 📌 Sample Data

The backend comes pre-loaded with:
- 4 sample policies (Health, Life, Vehicle, Property)
- 2 sample claims (one approved, one pending)

---

## 💡 Future Enhancements
- Add MongoDB or PostgreSQL for persistence
- Add JWT authentication
- Add PDF policy generation
- Add email notifications
- Add payment gateway integration
- Add charts with Recharts
