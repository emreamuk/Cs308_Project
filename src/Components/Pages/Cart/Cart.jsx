import React from "react";
import "./Cart.css";

const Cart = ({ items = [], onQtyIncrease, onQtyDecrease, onRemove }) => {
  return (
    <div className="cart-page">
      <h1 className="cart-title">Your Cart</h1>

      <div className="cart-layout">
        
        {/* LEFTSIDE PRODUCTS */}
        <div className="cart-items">
          {items.length === 0 ? (
            <p className="cart-empty">Your cart is empty.</p>
          ) : (
            items.map((item) => (
              <div className="cart-item" key={item.id}>
                
                {/* Product Photos*/}
                <img 
                  className="cart-item-img"
                  src={item.img}  
                  alt={item.title}
                />

                {/* Product Info */}
                <div className="cart-item-info">
                  <h2>{item.title}</h2>
                  <p className="cart-item-meta">{item.description}</p>

                  <div className="cart-item-controls">

                    {/* Quantity */}
                    <div className="cart-qty">
                      <button onClick={() => onQtyDecrease(item.id)}>-</button>
                      <span>{item.qty}</span>
                      <button onClick={() => onQtyIncrease(item.id)}>+</button>
                    </div>

                    {/* Price */}
                    <p className="cart-price">${item.price}</p>

                    {/* Remove */}
                    <button 
                      className="cart-remove"
                      onClick={() => onRemove(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="cart-summary">
          <h2>Order Summary</h2>

          {/* backend */}
          <div className="summary-row">
            <span>Subtotal</span>
            <span>$0</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>$0</span>
          </div>

          <div className="summary-row summary-total">
            <span>Total</span>
            <span>$0</span>
          </div>

          <button className="checkout-btn">
            Proceed to Checkout
          </button>

          <p className="summary-note">
            Taxes and shipping calculated at checkout
          </p>
        </div>
      </div>
    </div>
  );
};

export default Cart;
