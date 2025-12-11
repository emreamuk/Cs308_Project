// src/context/CartContext.js
import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartItems([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes (but only AFTER initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  // UPDATED: Check stock limit before adding
  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item._id === product._id);
    
    if (existingItem) {
      // Check if we can add one more
      if (existingItem.qty >= product.quantityInStock) {
        alert(`Cannot add more. Only ${product.quantityInStock} items in stock.`);
        return false; // Indicate failure
      }
      
      setCartItems(cartItems.map(item =>
        item._id === product._id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      // First time adding - check if stock available
      if (product.quantityInStock < 1) {
        alert('This product is out of stock.');
        return false;
      }
      
      setCartItems([...cartItems, { ...product, qty: 1 }]);
    }
    return true; // Indicate success
  };

  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item._id !== productId));
  };

  // ✅ UPDATED: Check stock limit before increasing
  const increaseQty = (productId) => {
    const item = cartItems.find(item => item._id === productId);
    
    if (!item) return;
    
    // Check stock limit
    if (item.qty >= item.quantityInStock) {
      alert(`Cannot add more. Only ${item.quantityInStock} items in stock.`);
      return;
    }
    
    setCartItems(cartItems.map(item =>
      item._id === productId ? { ...item, qty: item.qty + 1 } : item
    ));
  };

  const decreaseQty = (productId) => {
    const item = cartItems.find(item => item._id === productId);
    if (item.qty === 1) {
      removeFromCart(productId);
    } else {
      setCartItems(cartItems.map(item =>
        item._id === productId ? { ...item, qty: item.qty - 1 } : item
      ));
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.qty, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      increaseQty,
      decreaseQty,
      clearCart,
      getCartTotal,
      getCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};