import { useNavigate } from "react-router-dom";
import { Menu, X, Shield } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="w-full bg-white/90 backdrop-blur-lg shadow-lg fixed top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo with premium styling */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-md">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div
              onClick={() => navigate("/")}
              className="flex flex-col cursor-pointer group"
            >
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                StaffNet
              </span>
              <span className="text-xs text-gray-500 font-medium tracking-wider">
                EMPLOYEE MANAGEMENT
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => scrollTo("home")}
              className="relative px-6 py-3 text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300 group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button
              onClick={() => scrollTo("about")}
              className="relative px-6 py-3 text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300 group"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button
              onClick={() => scrollTo("features")}
              className="relative px-6 py-3 text-gray-700 font-medium hover:text-indigo-600 transition-colors duration-300 group"
            >
              Features
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300 group-hover:w-full"></span>
            </button>
          </div>

          {/* Premium Login Button - FIXED VERSION */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => navigate("/login")}
              className="group relative px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
            >
              {/* Button shine effect - reduced opacity to avoid covering text */}
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
              
              {/* Button content */}
              <span className="relative flex items-center justify-center gap-2">
                <span>Login</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              
              {/* REMOVED the problematic white overlay that was covering the text */}
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl">
          <div className="px-4 pt-4 pb-6 space-y-1">
            <button
              onClick={() => scrollTo("home")}
              className="w-full text-left px-4 py-4 text-lg font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollTo("about")}
              className="w-full text-left px-4 py-4 text-lg font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollTo("features")}
              className="w-full text-left px-4 py-4 text-lg font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
            >
              Features
            </button>
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  navigate("/login");
                  setIsMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}