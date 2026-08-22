# 🌾 AgroMarket (এগ্রোমার্কেট): Farm-Fresh, Direct to You

> A full-stack direct-to-consumer agricultural marketplace tailored for **Bangladesh** — connecting local farmers (কৃষক) directly with buyers (ক্রেতা).

---

## 🇧🇩 Bangladesh Market Adaptations

- **Currency:** BDT (`৳` Taka).
- **Units:** `kg` (কেজি), `mon / maund` (মন - 40 kg bulk), `piece` (পিস / হালি), `dozen` (ডজন), `liter` (লিটার).
- **Produce Categories:** Rice & Grains (মিনিকট/নাজিরশাইল চাল), Seasonal Fruits (রাজশাহীর আম, দিনাজপুরের লিচু), Vegetables (বগুড়া/যশোরের সবজি), Spices (পেঁয়াজ/রসুন), Dairy & Eggs (খাঁটি দুধ/দেশি ডিম).
- **Regional Filters:** 8 Divisions & District origin tagging (Dhaka, Rajshahi, Chattogram, Rangpur, Bogura, Dinajpur, Jessore, Sylhet, Barishal, Mymensingh).
- **Payment Options:** bKash (বিকাশ), Nagad (নগদ), Rocket (রকেট), and Cash on Delivery (ক্যাশ অন ডেলিভারি).
- **Fulfillment:** Home / Courier Delivery vs. Farm Pickup (খামার থেকে সরাসরি সংগ্রহ).
- **Language Support:** Bilingual interface (English & Bangla - বাংলা).

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS (Clean Green & White Theme `#16a34a` / `#22c55e`), Lucide Icons, Hind Siliguri Bangla Font.
- **Backend:** Node.js, Express.js (REST API, JWT Auth, RBAC Middleware).
- **Database:** MySQL (Relational DB, Foreign Keys, Stored Views for Real-Time Price Aging).

---

## 🌟 Key Features & Functionality

### 1. Multi-User Ecosystem
- **Buyers (ক্রেতা):** Browse produce, view dynamic price decay in ৳, select **Home Delivery vs. Farm Pickup** at checkout, pay via bKash/Nagad/COD, 1-click reorder, star ratings/reviews, wishlist.
- **Farmers (কৃষক/বিক্রেতা):** List crops in Kg or Mon (মন), set harvest date & shelf life, receive real-time **Low-Stock Alerts (কম স্টকের সতর্কবার্তা)**, track earnings in ৳, maintain farm storefront pages.
- **Admins (অ্যাডমিন):** Platform revenue stats in ৳, top-performing seller leaderboard, user management, expired produce audit logs.

### 2. Search & Catalog Tweaks
- **Sorting:** Filter and sort listings by **Freshness (নবীনতম ফসল)**, Price (Low/High), Division/District, Category.
- **Low-Stock Alerts:** Automated warning banners when stock falls below custom thresholds.

### 3. Seller Storefront Pages
- Dedicated profile pages for farmers displaying all their products, farm location district, and overall star ratings.

### 4. Wow Factor: Real-Time Produce Price Aging & Auto-Expiration
- **Dynamic Pricing Engine:** Prices automatically drop as produce ages relative to harvest date and maximum shelf life (reduces post-harvest loss).
- **Automated Expiration:** Once produce reaches max shelf life, it is automatically marked `EXPIRED` and hidden from catalog search.

---

## 📋 Comprehensive Implementation Plan

For the complete technical specification, MySQL database schema, Express API endpoints, and step-by-step roadmap tailored for Bangladesh:

👉 **[SYSTEM_PLAN.md](./SYSTEM_PLAN.md)**

---