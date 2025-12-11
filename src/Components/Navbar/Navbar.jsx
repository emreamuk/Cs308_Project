// src/Components/Navbar/Navbar.jsx
import React, { useState, useEffect, useContext} from 'react';
import "./Navbar.css";
import logo from '../Assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext'; 

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  const { getCartCount } = useContext(CartContext);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <div className='navbar'>
      <div className='nav-logo'>
        <Link to="/">
          <img src={logo} alt="AO Comics Logo"/>
        </Link>
        <p>AO Comics</p>
      </div>

      <ul className="nav-menu">
        <li onClick={() => navigate('/')}>Shop</li>
        <li onClick={() => navigate('/search')}>Search</li>
        <li onClick={() => navigate('/orders')}>My Orders</li>
        <li onClick={() => navigate('/product-manager')}>Manager</li>
        <li>Comics</li>
        <li>Books</li>
        <li>Games</li>
      </ul>

      <div className='nav-login-cart'>
        {user ? (
          <>
            <span style={{ marginRight: '15px', fontSize: '14px' }}>
              Hello, {user.name}
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">
            <button>Login</button>
          </Link>
        )}
        
        <Link to="/cart" style={{position: 'relative', display: 'inline-block'}}>
          <img src="/assets/cart_icon.png" alt="Cart" />
          {getCartCount() > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#ff4141',
              color: 'white',
              borderRadius: '50%',
              width: '22px',
              height: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {getCartCount()}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Navbar;