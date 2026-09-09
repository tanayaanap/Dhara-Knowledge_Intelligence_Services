import React, { useEffect, useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import CropPrediction from './pages/CropPrediction';
import DiseasePrediction from './pages/DiseasePrediction';
import Fertilizer from './pages/Fertilizer';
import AboutUs from './pages/AboutUs';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AnimatedBackground from './components/AnimatedBackground';
import DarkModeToggle from './components/DarkModeToggle';
import Chatbot from './pages/Chatbot';
import farmBg from "./assets/farm.jpg";
const NAV_LINKS = [
  { to: '/', label: 'Dashboard', testId: 'nav-dashboard' },
  { to: '/crop-prediction', label: 'Crop Prediction', testId: 'nav-crop-prediction' },
  { to: '/disease-prediction', label: 'Disease Prediction', testId: 'nav-disease-prediction' },
  { to: '/fertilizer', label: 'Fertilizer', testId: 'nav-fertilizer' },
  { to: '/about', label: 'About Us', testId: 'nav-about' },
];

function Navigation({ user, isAuthenticated }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-50 dark:bg-slate-900/80 dark:border-slate-700/50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-lg">🌾</span>
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight dark:text-gray-50">DharaAI</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-0.5">
            {NAV_LINKS.map(({ to, label, testId }) => (
              <Link
                key={to}
                to={to}
                data-testid={testId}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all dark:text-gray-100 ${
                  isActive(to)
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop Right: User or Login */}
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 hover:bg-green-100 border border-green-100 hover:border-green-200 transition-all group dark:bg-gray-100/20 dark:hover:bg-gray-100/30"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 select-none">
                  {initials}
                </div>
                <span className="text-green-700 font-medium text-sm max-w-[110px] truncate dark:text-gray-50">
                  {user?.name || user?.email}
                </span>
                <svg className="w-3.5 h-3.5 text-green-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-all shadow-sm hover:shadow-md"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-gray-100 space-y-1 animate-fade-in">
            {NAV_LINKS.map(({ to, label, testId }) => (
              <Link
                key={to}
                to={to}
                data-testid={`mobile-${testId}`}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(to)
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                {label}
              </Link>
            ))}
            <div className="pt-1 border-t border-gray-100 mt-1">
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-green-50 border border-green-100"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold select-none">
                    {initials}
                  </div>
                  <span className="text-green-700 font-medium text-sm truncate">
                    {user?.name || user?.email}
                  </span>
                  <svg className="w-3.5 h-3.5 text-green-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-all"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/user', { credentials: 'include' });
      const data = await response.json();
      if (response.ok && data.authenticated) {
        setUser({ email: data.email, name: data.name || '' });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // ignore network errors on logout
    }
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <Router>
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <DarkModeToggle />
        <Navigation user={user} isAuthenticated={isAuthenticated} />
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/crop-prediction" element={<CropPrediction />} />
          <Route path="/disease-prediction" element={<DiseasePrediction />} />
          <Route path="/fertilizer" element={<Fertilizer />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/login" element={<Login onLogin={refreshUser} />} />

          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={<Profile onUserUpdate={refreshUser} onLogout={handleLogout} />}
          />
        </Routes>
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;
