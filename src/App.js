
import './App.css';
import Navbar from './Components/Navbar/Navbar';
import LoginSignUp from './Components/Pages/LoginSignUp/LoginSignUp'
import Login from './Components/Pages/Login/Login'



function App() {
  return (
    <div> 
      {/* for now both components are rendered one below the other I’ll connect them later*/}
        <Navbar/>
        <LoginSignUp/>
        <Navbar/>
        <Login/>
        
    </div>
  );
}

export default App;

