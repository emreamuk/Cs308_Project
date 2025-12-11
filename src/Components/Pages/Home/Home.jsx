// src/Components/Pages/Home/Home.jsx
import React, { useState, useEffect, useContext } from "react";
import "./Home.css";
import Header from "../../Header/Header";
import API from "../../../services/api";
import { CartContext } from "../../../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tempSort, setTempSort] = useState('');
  const [tempCategory, setTempCategory] = useState('');
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

useEffect(() => {
  const fetchProducts = async () => {
    try {
      let url = '/products?';
      if (sortBy) url += `sort=${sortBy}&`;
      if (categoryFilter) url += `category=${categoryFilter}`;

      console.log('Fetching:', url);
      
      const response = await API.get(url);
      setComics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      setLoading(false);
    }
  };

  fetchProducts();
}, [sortBy, categoryFilter]);

  const handleApplyFilters = () => {
    setSortBy(tempSort);
    setCategoryFilter(tempCategory);
  };

    const handleClearFilters = () => {
    setTempSort('');
    setTempCategory('');
    setSortBy('');
    setCategoryFilter('');
  };

  const handleAddToCart = (product) => {
    const success = addToCart(product); // Capture return value
    
    if (success) { // Only show success if it worked
      alert(`${product.name} added to cart!`);
  }
  };

  if (loading) {
    return (
      <main className="home">
        <Header />
        <div style={{ padding: '4vw 6vw', textAlign: 'center' }}>
          <h2>Loading products...</h2>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="home">
        <Header />
        <div style={{ padding: '4vw 6vw', textAlign: 'center', color: 'red' }}>
          <h2>{error}</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="home">
      <Header />

      <section className="comics-section">
        <div className="section-header">
          <h2>Just Added</h2>
          
          <div className="filters">
            {/* Category Filter */}
            <select 
              value={tempCategory} 
              onChange={(e) => setTempCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All Categories</option>
              <option value="Marvel">Marvel</option>
              <option value="DC">DC</option>
              <option value="Image">Image</option>
              <option value="Dark Horse">Dark Horse</option>
            </select>

            {/* Sort */}
            <select 
              value={tempSort}  
              onChange={(e) => setTempSort(e.target.value)}
              className="filter-select"
            >
              <option value="">Sort By</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
            </select>

            <button onClick={handleApplyFilters} className="apply-btn">
              Apply Filters
            </button>
            <button onClick={handleClearFilters} className="clear-btn">
              Clear
            </button>
          </div>
        </div>

        <div className="comics-grid">
          {comics.length === 0 ? (
            <p style={{gridColumn: '1/-1', textAlign: 'center', padding: '40px'}}>
              No products found
            </p>
          ) : (
            comics.map((c) => (
              <div 
                className="comic-card" 
                key={c._id} 
                onClick={() => navigate(`/product/${c._id}`)} 
                style={{cursor: 'pointer'}}
              >
                <img src={c.imageUrl} alt={c.name} />
                <h3>{c.name}</h3>
                <p>{c.category}</p>
                
                {/* Rating Display */}
                <div style={{fontSize: '0.9rem', margin: '0.5vw 0'}}>
                  <span>{'⭐'.repeat(Math.round(c.rating))}</span>
                  <span style={{color: '#777', marginLeft: '5px'}}>
                    ({c.numReviews})
                  </span>
                </div>

                <p style={{fontWeight: 'bold', color: '#ff4141', fontSize: '1.1rem'}}>
                  ${c.price}
                </p>
                <p style={{
                  fontSize: '0.85rem', 
                  color: c.quantityInStock > 0 ? 'green' : 'red',
                  marginTop: '0.5vw'
                }}>
                  {c.quantityInStock > 0 
                    ? `${c.quantityInStock} in stock` 
                    : 'Out of Stock'}
                </p>
                <button 
                  disabled={c.quantityInStock === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(c);
                  }}
                >
                  {c.quantityInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}