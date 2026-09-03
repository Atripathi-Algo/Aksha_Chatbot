import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, UserPlus ,Building2, ChevronDown} from "lucide-react";
import akshaLogo from "../assets/images/AkshaLogo.png";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js'
import { ToastContainer, toast } from 'react-toastify';



const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: '', // 'user' or 'admin'
    companyName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [companyOptions, setCompanyOptions] = useState([
    'Tech Solutions Inc.',
    'Digital Innovations Corp.',
    'Global Systems Ltd.',
    'Future Enterprises',
    'Smart Business Co.',
    'Innovative Software LLC',
    'Data Analytics Group',
    'Cloud Computing Services'
  ]);
  const navigate = useNavigate();
  const SECRET_KEY = process.env.REACT_APP_PASSWORD_SECRET_KEY

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

 const handleCompanySelect = (company) => {
    handleInputChange('companyName', company);
    setCompanySearch('');
    setShowCompanyDropdown(false);
  };

  const handleCompanyInputChange = (value) => {
    setCompanySearch(value);
    handleInputChange('companyName', value);
    setShowCompanyDropdown(true);
  };

  const handleCompanyInputBlur = () => {
    // Add delay to allow click on dropdown items
    setTimeout(() => {
      if (companySearch.trim() && !companyOptions.includes(companySearch.trim())) {
        // Add new company to the list if it doesn't exist
        setCompanyOptions(prev => [...prev, companySearch.trim()]);
      }
      setShowCompanyDropdown(false);
    }, 200);
  };

  const handleCompanyInputFocus = () => {
    setShowCompanyDropdown(true);
  };

  // Filter companies based on search
  const filteredCompanies = companyOptions.filter(company =>
    company.toLowerCase().includes(companySearch.toLowerCase())
  );

  

  const handleSubmit = async () => {

  if (formData.password !== formData.confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  if (!agreeToTerms) {
    alert("Please accept the terms and conditions");
    return;
  }

  const hashedPassword = CryptoJS.HmacSHA256(formData.password, SECRET_KEY).toString();

  try {
    const payload = {
      email: formData.email,
      passwordHash: hashedPassword, // Send raw password if your backend hashes it
      role: formData.userType,
      companyName: formData.companyName,
      userName: `${formData.firstName} ${formData.lastName}`,
    };
    

    const res = await axiosInstance.post('/register', payload);

    if(res.status === 200) {
      toast.success('Account created successfully!');
      navigate('/login');
    }
    console.log(res.data);
  } catch (err) {
    if (err.response) {
      toast.error('Error creating account: ' + err.response.data.message || 'Something went wrong');
      console.log(err.response.data);
    } else {
      alert('Network error');
    }
  }
};

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Section */}
      <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-8 text-white">
        <div className="text-center max-w-md">
          {/* Logo */}
          <div className="mb-6 flex justify-center ">
            <img src={akshaLogo} alt="" className="w-40" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-light mb-4 text-black">
            Welcome to AI Surveillance Portal
          </h1>

          {/* Subtitle */}
          <p className="text-black text-lg leading-relaxed">
            Secure. Smart. Real-time Monitoring.
          </p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Create Account
            </h2>
            <p className="text-gray-600">
              Sign up to get started with your account
            </p>
          </div>

          {/* Signup Form */}
          <div className="space-y-5">
            {/* Name Fields Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="First name"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <div className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

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
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

             {/* Company Name Dropdown */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleCompanyInputChange(e.target.value)}
                  onFocus={handleCompanyInputFocus}
                  onBlur={handleCompanyInputBlur}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Type or select your company"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showCompanyDropdown ? 'rotate-180' : ''}`} />
                </div>
                
                {/* Dropdown Menu */}
                {showCompanyDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCompanies.length > 0 ? (
                      filteredCompanies.map((company, index) => (
                        <button
                          key={index}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                          onClick={() => handleCompanySelect(company)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {company}
                        </button>
                      ))
                    ) : companySearch.trim() ? (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        Press Enter or click outside to add "{companySearch.trim()}" as a new company
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        Start typing to search companies
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User Type Selection */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-3">
                Account Type
              </div>
              <div className="flex space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="user"
                    checked={formData.userType === 'user'}
                    onChange={(e) => handleInputChange('userType', e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">User</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="admin"
                    checked={formData.userType === 'admin'}
                    onChange={(e) => handleInputChange('userType', e.target.value)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-700">Admin</span>
                </label>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Create a password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
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
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Confirm your password"
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

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div className="ml-3 text-sm">
                <span className="text-gray-600">I agree to the </span>
                <button className="text-blue-600 hover:text-blue-500 transition-colors duration-200">
                  Terms and Conditions
                </button>
                <span className="text-gray-600"> and </span>
                <button className="text-blue-600 hover:text-blue-500 transition-colors duration-200">
                  Privacy Policy
                </button>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Account
            </button>


            {/* Sign In Link */}
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{" "}
              </span>
              <Link to={'/login'} className="text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
