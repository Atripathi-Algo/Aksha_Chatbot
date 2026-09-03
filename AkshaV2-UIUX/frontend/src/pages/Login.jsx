import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import akshaLogo from '../assets/images/AkshaLogo.png';
import { Link, useNavigate } from 'react-router-dom';
import { loginSuccess } from 'global_store/reducers/authReducer';
import axiosInstance from 'utils/axiosInstance';
import { useDispatch } from 'react-redux';
import CryptoJS from 'crypto-js';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const SECRET_KEY = process.env.REACT_APP_PASSWORD_SECRET_KEY;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.warn('Please fill in both email and password');
      return;
    }

    const passwordHash = CryptoJS.HmacSHA256(password, SECRET_KEY).toString();

    try {
      const res = await axiosInstance.post('/login', {
        email,
        passwordHash,
      });

      
      const { token, email: userEmail, role } = res.data; 
      console.log('Login response:', token, userEmail, role);

      if (res.status === 200) {
        toast.success('Login successful!');
        localStorage.setItem('isLoggedIn', 'true');
        dispatch(loginSuccess({
          token,
          email: userEmail,
          role,
        }));

        navigate('/monitor');
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="flex-1 bg-gradient-to-br bg-gray-50 flex flex-col items-center justify-center p-8 text-black">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <img src={akshaLogo} alt="Aksha Logo" className="w-40" />
          </div>
          <h1 className="text-3xl font-light mb-4">Welcome to AI Surveillance Portal</h1>
          <p className="text-black text-lg leading-relaxed">Secure. Smart. Real-time Monitoring.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <Link to="/forgotpassword" type="button" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sign In
            </button>

            {/* Sign Up */}
            <div className="text-center">
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <Link to="/signup" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
