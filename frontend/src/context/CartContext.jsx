import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('agromarket_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse cart from storage:', e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('agromarket_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to storage:', e);
    }
  }, [cart]);

  // Add item to cart (with quantity and selected unit: 'kg', 'mon', etc.)
  const addToCart = (product, quantity = 1, unit = null) => {
    const selectedUnit = unit || product.unit || 'kg';
    
    // Calculate unit multiplier (e.g. 1 mon = 40 kg)
    const isMonSelected = selectedUnit === 'mon' && product.unit === 'kg';
    const effectiveUnitPrice = isMonSelected
      ? Number(product.current_dynamic_price_bdt || product.base_price_bdt) * 40
      : Number(product.current_dynamic_price_bdt || product.base_price_bdt);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.id === product.id && item.selectedUnit === selectedUnit
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prevCart,
          {
            id: product.id,
            title: product.title,
            title_bn: product.title_bn,
            image_url: product.image_url,
            unit: product.unit,
            selectedUnit,
            unitPrice: effectiveUnitPrice,
            basePrice: product.base_price_bdt,
            farm_name: product.farm_name,
            farm_district: product.farm_district,
            stock_quantity: product.stock_quantity,
            quantity
          }
        ];
      }
    });
  };

  const updateQuantity = (productId, selectedUnit, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedUnit);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId && item.selectedUnit === selectedUnit
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId, selectedUnit) => {
    setCart((prevCart) =>
      prevCart.filter(
        (item) => !(item.id === productId && item.selectedUnit === selectedUnit)
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('agromarket_cart');
  };

  // Derived totals
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItemsCount,
        subtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
