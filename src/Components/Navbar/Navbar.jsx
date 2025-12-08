import React from 'react'
import "./Navbar.css"
import logo from '../Assets/logo.png'
import cart_icon from '../Assets/cart_icon.png'
import search_icon from '../Assets/search_icon.png'
import { Link } from 'react-router-dom'; 

const Navbar = () => {
  return (
    <div className='navbar'>

      {/* Logo + AO Comics → Home'a götürür */}
      <Link to="/" className='nav-logo'>
        <img src={logo} alt="Logo" />
        <p>AO Comics</p>
      </Link>

      {/* Menü */}
      <ul className="nav-menu">
        <li>Shop</li>
        <li>Comics</li>
        <li>Books</li>
        <li>Games</li>
      </ul>
      
      {/* Sağ taraf */}
      <div className='nav-login-cart'>

        {/* Login */}
        <Link to="/login">
          <button className="nav-login-btn">Login</button>
        </Link>

        {/* Search */}
        <Link to="/search">
          <img 
            className="nav-icon nav-search-icon"
            src={search_icon}
            alt="Search"
          />
        </Link>

        {/* Cart */}
        <Link to="/cart">
          <img
            className="nav-icon nav-cart-icon"
            src={cart_icon}
            alt="Cart"
          />
        </Link>

      </div>
    </div>
  )
}

export default Navbar
