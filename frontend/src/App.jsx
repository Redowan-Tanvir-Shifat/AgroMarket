import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import SellerStorefront from './pages/SellerStorefront';
import CartCheckout from './pages/CartCheckout';
import BuyerOrders from './pages/BuyerOrders';
import Wishlist from './pages/Wishlist';

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen flex flex-col bg-emerald-50/30">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/products" element={<Catalog />} />
                  <Route path="/products/:id" element={<ProductDetails />} />
                  <Route path="/storefront/:sellerId" element={<SellerStorefront />} />
                  <Route path="/checkout" element={<CartCheckout />} />
                  <Route path="/account/orders" element={<BuyerOrders />} />
                  <Route path="/account/wishlist" element={<Wishlist />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </CartProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
