import React from 'react'
import "./Navbar.css"
import logo from '../Assets/logo.png'
import cart_icon from '../Assets/cart_icon.png'
import search_icon from '../Assets/search_icon.png'
import { Link } from 'react-router-dom'; 

const Navbar = () => {
  return (
    <div className ='navbar'>
        <div className='nav-logo'>
            <img src={logo} alt=""/>
            <p>AO Comics</p>
        </div>

        <ul className="nav-menu">
            <li>Shop</li>
            <li>Comics</li>
            <li>Books</li>
            <li>Games</li>
        </ul>
        
    <div className='nav-login-cart'>
                <Link to="/login">
                    <button>Login</button>
                </Link>

                {/* Search Icon */}
                <img 
                    className="nav-search-icon" 
                    src={search_icon} 
                    alt="Search" 
                />

                {/* Cart Icon */}
                <img 
                    className="nav-cart-icon" 
                    src={cart_icon} 
                    alt="Cart" 
                />
            </div>
    </div>
  )
}

export default Navbar