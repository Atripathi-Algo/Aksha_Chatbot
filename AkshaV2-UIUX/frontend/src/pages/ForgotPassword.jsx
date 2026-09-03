import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, KeyRound, ArrowLeft } from "lucide-react";
import akshaLogo from "../assets/images/AkshaLogo.png";
import { Link, useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import { toast } from 'react-toastify';
import axiosInstance from 'utils/axiosInstance';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const SECRET_KEY = process.env.REACT_APP_PASSWORD_SECRET_KEY;

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!email || !newPassword || !confirmPassword) {
      alert("Please fill in all fields!");
      return;
    }
    
    try {
    // Hash the password using your frontend secret key
    const hashedPassword = CryptoJS.HmacSHA256(newPassword, SECRET_KEY).toString();

    // Make API call
    const response = await axiosInstance.post("/reset-password", {
      email,
      passwordHash: hashedPassword,
    });

    if (response.status === 200) {
      toast.success("Password reset successful! You can now log in.");
      // Redirect to login page or perform any other action
      navigate("/login");
    }
  } catch (err) {
    console.error("Reset error:", err);
    toast.error(err.response?.data?.message || "Something went wrong.");
  }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Section */}
      <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-8 text-white">
        <div className="text-center max-w-md">
          {/* Logo */}
          <div className="text-center max-w-md">
            <div className="mb-6 flex justify-center">
              <img src={akshaLogo} alt="Aksha Logo" className="w-40" />
            </div>
            <h1 className="text-3xl font-light mb-4">
              Welcome to AI Surveillance Portal
            </h1>
            <p className="text-black text-lg leading-relaxed">
              Secure. Smart. Real-time Monitoring.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600">Enter your email and new password</p>
          </div>

          {/* Reset Password Form */}
          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* New Password Field */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter new password"
                />
                <button
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm new password"
                />
                <button
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Reset Password Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Reset Password
            </button>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link to="/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
