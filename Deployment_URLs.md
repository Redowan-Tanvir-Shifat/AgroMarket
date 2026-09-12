# 🌐 AgroMarket - Production Deployment URLs & Infrastructure Directory

This document contains all live production URLs, endpoints, and cloud infrastructure connection details for the **AgroMarket** platform.

---

## 🚀 1. Frontend Web Application

* **Live URL:** [https://agro-market-phi.vercel.app](https://agro-market-phi.vercel.app/)
* **Hosting Platform:** [Vercel](https://vercel.com) (Global Edge CDN)
* **Framework / Core Tech:** React 19, Vite, Tailwind CSS, Lucide Icons, Socket.io Client
* **Description:** 
  The primary user-facing Single Page Application (SPA). Includes dual-language support (English & Bengali / বাংলা), interactive produce catalog with dynamic harvest age pricing, real-time Socket.io notifications with synthesized Web Audio chimes, buyer-farmer live chat hub (`/messages`), order management, and dedicated seller/buyer profile hubs.
* **Routing Configuration:** Configured with `frontend/vercel.json` wildcard rewrites to `/index.html` for clean client-side routing.

---

## ⚡ 2. Backend REST API & Real-Time WebSocket Server

* **Primary Server URL:** [https://agromarket-abc9.onrender.com](https://agromarket-abc9.onrender.com/)
* **Health Check Endpoint:** [https://agromarket-abc9.onrender.com/api/health](https://agromarket-abc9.onrender.com/api/health)
* **Public Produce Catalog API:** [https://agromarket-abc9.onrender.com/api/products](https://agromarket-abc9.onrender.com/api/products)
* **Hosting Platform:** [Render](https://render.com) (Node.js Web Service)
* **Core Tech:** Node.js, Express.js, Socket.io, JWT Authentication, Cloudinary Media Storage
* **Description:** 
  Handles REST API operations, database connection pooling, user authentication, Cloudinary image uploads, and real-time Socket.io multiplexed event rooms (`user_${id}`, `seller_${id}`, `conv_${id}`). Runs as a continuous service to ensure 24/7 persistent WebSocket connections.

---

## ☁️ 3. Cloud Database (Distributed Serverless MySQL)

* **Host Endpoint:** `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`
* **Port:** `4000`
* **Database Name:** `test`
* **Default User:** `32QzCk5qEyHwZLg.root`
* **Cloud Region:** AWS Singapore (`ap-southeast-1` - optimized for lowest latency to Bangladesh)
* **Cloud Provider:** [TiDB Cloud](https://tidbcloud.com) (Serverless MySQL 8.0 Compatible)
* **Connection Security:** Enforces TLS/SSL encrypted transport (`ssl: { rejectUnauthorized: false }`)
* **Description:** 
  Stores all application records: registered users, sellers, categories, active produce inventory, orders, payment statuses, wishlists, reviews, notifications, and conversation histories.

---

## ☁️ 4. Media & Asset Storage (Cloudinary CDN)

* **Cloud Name:** `dnlvg4ato`
* **Provider:** [Cloudinary](https://cloudinary.com)
* **Description:** 
  Hosts and optimizes user profile avatars, seller farm banners, product photography, and verification documentation.

---

### 📊 Quick Health Summary
| Service | Status | Protocol | Live Access |
| :--- | :--- | :--- | :--- |
| **Frontend** | 🟢 Active | HTTPS | [agro-market-phi.vercel.app](https://agro-market-phi.vercel.app/) |
| **Backend API** | 🟢 Active | HTTPS / WSS | [agromarket-abc9.onrender.com](https://agromarket-abc9.onrender.com/) |
| **Database** | 🟢 Active | MySQL / TLS | `gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000` |
