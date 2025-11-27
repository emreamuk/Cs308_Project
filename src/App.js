import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar/Navbar';
import Login from './Components/Pages/Login/Login';
import LoginSignUp from './Components/Pages/LoginSignUp/LoginSignUp';
import Home from "./Components/Pages/Home/Home";
import Cart from "./Components/Pages/Cart/Cart";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<LoginSignUp />} />
        <Route path="/cart" element={<Cart />} /> 
      </Routes>
    </Router>
  );
}

export default App;