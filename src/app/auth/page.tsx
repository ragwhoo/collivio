"use client";

import auth from "@/lib/auth";

export default function AuthLoginPage() {
  const handleStudentLogin = () => {
    window.location.href = "/auth/signup?type=student";
  };

  const handleBusinessLogin = () => {
    window.location.href = "/auth/signup?type=business";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-10">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                <line x1="9" y1="15" x2="9.01" y2="15"></line>
                <line x1="15" y1="15" x2="15.01" y2="15"></line>
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-center mb-4">Welcome Back!</h2>
          <p className="text-center text-sm text-gray-600 mb-8">Please select your account type to continue</p>
          
          <div className="space-y-3 mb-8">
            {/* Student Login Button */}
            <button 
              onClick={handleStudentLogin} 
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-gray-300 hover:border-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Student Login</span>
            </button>
            
            {/* Business Login Button */}
            <button 
              onClick={handleBusinessLogin} 
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-primary bg-primary/10 hover:bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Business Login</span>
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>Don't have an account?</p>
            <a href="/signup" className="font-medium text-primary hover:underline">
              Create account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}