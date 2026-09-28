# pravi-hackathon

# InfraTrack – Infrastructure Asset Lifecycle Management System

An enterprise-grade infrastructure asset inventory, condition monitoring, inspection, and lifecycle management system designed for municipal and state public works agencies.

Built according to ISO 55000 asset management principles with clean enterprise aesthetics, responsive navigation, and role-based access control (RBAC).

---

## 🌟 Key Features

1. **Asset Inventory & Lifecycle Tracking (11 Stages)**
   - Complete CRUD tracking across 11 lifecycle stages: `PLANNED` → `APPROVED` → `PROCUREMENT` → `UNDER_CONSTRUCTION` → `COMMISSIONED` → `OPERATIONAL` → `UNDER_INSPECTION` → `UNDER_MAINTENANCE` → `REHABILITATION` → `DECOMMISSIONED` → `DISPOSED`.
   - Immutable `LifecycleEvent` trail recording previous/new status, timestamp, acting officer, justification, and remarks.

2. **Automated Asset Code & QR Tag Generation**
   - Unique auto-generated asset codes formatted by category prefix and year (e.g., `ROAD-2026-0001`, `BRG-2026-0001`, `WTR-2026-0001`).
   - Integrated QR code generation linking to `/assets/:assetCode`.
   - Printable physical asset plates and built-in camera QR scanner for mobile field engineers.
   - Dual-mode scanning: authenticated officers access complete technical dossier; public scans display verified non-sensitive asset credentials.

3. **Geospatial Infrastructure Map**
   - Interactive Leaflet + OpenStreetMap GIS map with condition-coded markers:
     - 🟢 **Excellent / Good** (Score 75–100)
     - 🟡 **Fair** (Score 50–74)
     - 🟠 **Poor** (Score 25–49)
     - 🔴 **Critical** (Score 0–24)
   - Interactive popups with live specs, district location, and direct dossier navigation.

4. **Multi-Faceted Condition Assessment & Scoring**
   - 0–100 condition scoring combining structural integrity, operational throughput, and safety compliance.
   - Automatic warnings for critical condition assets, overdue inspections, and end-of-life depreciation.

5. **Maintenance & Work Order Operations**
   - Maintenance requests (`MR-2026-0001`) with priorities (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
   - Work order generation (`WO-2026-0001`) with automatic cost calculation: `Total Cost = Labor + Material + Other`.
   - Work order completion automatically commits expenditure to the asset's cumulative maintenance and total lifecycle cost.
   - Preventive maintenance recurring schedules (e.g. every 30, 90, 180 days) with automated due-date telemetry.

6. **End-of-Life & Asset Replacement Planning**
   - Automatic identification of assets within 2 years of expected useful life.
   - Formal replacement planning workflow linking retiring assets to new capital commissions: marks old asset as `DISPOSED` and new surrogate as `COMMISSIONED` while preserving historical records.

7. **Capital Infrastructure Projects & Procurement**
   - Capital works programs (e.g., *Ahmedabad Ring Road Expansion*) linked to multiple assets.
   - Supplier/vendor directory with GST numbers, contact persons, and performance ratings.
   - Procurement purchase orders and automated warranty expiration alerts.

8. **Governance, Audit Trail & Reporting**
   - Immutable audit logging on asset creation, edits, inspections, and status transitions with previous/new state delta inspection.
   - 10 pre-configured reports with CSV data export.

---

## 🔑 Demo Accounts (Pre-Seeded)

The database automatically initializes realistic Gujarat/Ahmedabad municipal infrastructure data (Ahmedabad Ring Road, Sabarmati Riverfront Bridge, Kotarpur Water Treatment Plant, Prahladnagar Substation, etc.).

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `admin@infratrack.com` | `Admin@123` | Complete system access & configuration |
| **Asset Manager** | `assetmanager@infratrack.com` | `Asset@123` | Asset creation, lifecycle transitions, document management |
| **Field Engineer** | `engineer@infratrack.com` | `Engineer@123` | Maintenance tickets, field observations, work orders |
| **Public Viewer** | `viewer@infratrack.com` | `Viewer@123` | Read-only dashboards, maps, and reports |

*(You can also use the 1-Click Quick Demo Login buttons on the sign-in page or the top navigation role switcher).*

---

## 🏗️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Leaflet & React-Leaflet, Recharts, Lucide React, Axios, Html5-QRCode.
- **Backend**: Node.js, Express.js, Mongoose ODM, JWT Authentication, bcryptjs, Multer, Helmet, Morgan, Express Rate Limit, QRCode.
- **Database**: MongoDB with automatic in-memory fallback (`mongodb-memory-server`) for zero-friction local execution, plus Docker container support.

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+) and npm installed.

### 1. Start the Backend API
```bash
cd backend
npm install
npm start
```
*The server will boot on port `5000` (http://localhost:5000/api). If a local MongoDB instance is not detected, it seamlessly starts an in-memory database and auto-seeds all demo records!*

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
*The Vite frontend will start on http://localhost:5173.*
