import React from 'react' 
import './LoginSignUp.css'
import person from '../../Assets/person1.png';
import email from '../../Assets/email1.png';
import password from '../../Assets/password1.png';

const LoginSignUp = () => {
    return(
        <div className='container'>
            <div className='header'>
                <div className='text'>Login</div>
                <div className='underline'></div>

            </div>
            <div className='inputs'>
            <div className='input'>
                <img src={person} alt=''/>
                <input type='text'/>
            </div><div className='input'>
                <img src={email} alt=''/>
                <input type='email'/>
            </div><div className='input'>
                <img src={password} alt=''/>
                <input type='password'/>
            </div>
            </div>

        </div>
    )
}

export default LoginSignUp