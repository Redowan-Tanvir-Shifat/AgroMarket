# AgroMarket - Day 2 Summary

**Date:** August 24, 2026

---

## Pages Worked On in Day 2

1. **Product Details Page (`/products/:id`)**
   - High-res image display, dynamic produce aging engine meter, harvest age formatting (`16d 15h ago` / `১৬ দিন ১৫ ঘণ্টা আগে`), stock meter, unit switcher (`kg` vs. `mon`), farmer verification card with link to storefront, star ratings, and review submission form.
2. **Seller Storefront Page (`/storefront/:sellerId`)**
   - Public farmer profile header, verified badge (`যাচাইকৃত কৃষক`), location details, average star ratings, farm bio, and filterable active produce catalog.
3. **Cart & Checkout Page (`/checkout`)**
   - Itemized cart list with dynamic price snapshots, fulfillment switch (Home Delivery vs. Farm Pickup), Bangladeshi mobile banking simulation modals (**bKash**, **Nagad**, **Rocket**, **COD**), address form, and order placement.
4. **Buyer Dashboard & Order History (`/account/orders`)**
   - Order history with tab filters (*All Orders*, *Active*, *Delivered*, *Cancelled*), order tracking number, 3-step progress stepper, 1-click reorder button, and interactive customer review modal for delivered produce.
5. **Wishlist & Produce Tracker (`/account/wishlist`)**
   - Saved produce grid, real-time price decay & savings badges, 1-click "Move to Cart", and remove action.

---

## Features & Modules Covered in Day 2

1. **Global Shopping Cart State (`CartContext.jsx`)**
   - LocalStorage persistence, item counters, line totals, and automatic unit conversion between Kg and Mon (মন - ৪০ কেজি).
2. **Backend Commerce & Transaction Engine**
   - `orderRoutes.js` & `orderController.js`: Transactional order placement (`POST /api/orders`), order history (`GET /api/orders/my-orders`), 1-click reorder (`POST /api/orders/:id/reorder`), and status update (`PATCH /api/orders/:id/status`).
   - Automated stock decrementing upon checkout.
3. **Customer Reviews & Rating System**
   - `reviewRoutes.js` & `reviewController.js`: Review submission with automatic seller average rating (`rating_avg`) and count recalculation.
4. **Wishlist Engine**
   - `wishlistRoutes.js` & `wishlistController.js`: Saved produce tracker with real-time price drop notifications.
5. **Human-Readable Harvest Age Formatter (`formatters.js`)**
   - Automatically converts raw hours to friendly days and hours format (e.g. `16d 15h ago` / `১৬ দিন ১৫ ঘণ্টা আগে`).
6. **Comprehensive Bilingual Support**
   - 100% English and Bangla localization across all 5 new pages, stepper bars, payment modals, and notifications.
