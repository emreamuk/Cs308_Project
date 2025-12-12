import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Login from './Components/Pages/Login/Login';
import LoginSignUp from './Components/Pages/LoginSignUp/LoginSignUp';
import Home from "./Components/Pages/Home/Home";
import Cart from "./Components/Pages/Cart/Cart";
import SearchPage from "./Components/Pages/Search/SearchPage";
import Checkout from "./Components/Pages/Checkout/Checkout";
import Orders from "./Components/Pages/Orders/Orders";
import ProductDetail from "./Components/Pages/ProductDetail/ProductDetail";
import ProductManager from "./Components/Pages/ProductManager/ProductManager";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<LoginSignUp />} />
        <Route path="/cart" element={<Cart />} /> 
        <Route path="/search" element={<SearchPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/product-manager" element={<ProductManager />} />
      </Routes>
    </Router>
  );
}

export default App;