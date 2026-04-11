import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CropPrediction from './pages/CropPrediction';
import DiseasePrediction from './pages/DiseasePrediction';
import Fertilizer from './pages/Fertilizer';
import AboutUs from './pages/AboutUs';
import Login from './pages/Login';
import Register from './pages/Register';

function Navigation({ user, isAuthenticated }) {
    const location = useLocation();
    
    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl font-bold">🌾</span>
                </div>
                <span className="text-2xl font-bold text-gray-800">DharaAI</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
                <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive('/') 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-green-50'
                }`}
                data-testid="nav-dashboard"
                >
                Dashboard
                </Link>
                <Link
                to="/crop-prediction"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive('/crop-prediction') 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-green-50'
                }`}
                data-testid="nav-crop-prediction"
                >
                Crop Prediction
                </Link>
                <Link
                to="/disease-prediction"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive('/disease-prediction') 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-green-50'
                }`}
                data-testid="nav-disease-prediction"
                >
                Disease Prediction
                </Link>
                <Link
                to="/fertilizer"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive('/fertilizer') 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-green-50'
                }`}
                data-testid="nav-fertilizer"
                >
                Fertilizer
                </Link>
                <Link
                to="/about"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive('/about') 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-green-50'
                }`}
                data-testid="nav-about"
                >
                About Us
                </Link>
                {isAuthenticated ? (
                    <span className="px-4 py-2 rounded-lg bg-green-50 text-green-700 font-medium">
                        {user?.name || user?.email}
                    </span>
                    ) : (
                    <Link
                        to="/login"
                    className="px-4 py-2 rounded-lg bg-green-500 text-white font-medium transition-all hover:bg-green-600"
                    >
                        Login
                    </Link>
                )}
            </div>
            
            {/* Mobile menu button */}
            <button className="md:hidden text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
            </div>
        </div>
        </nav>
    );
    }

    function App() {
        const [user, setUser] = useState(null)
        const [isAuthenticated, setIsAuthenticated] = useState(false)

        useEffect(() => {
            const fetchUser = async () => {
            try {
                const response = await fetch('/api/user', {
                credentials: 'include'
                })
                const data = await response.json()
                if (response.ok && data.authenticated) {
                setUser({ email: data.email, name: data.name || '' })
                setIsAuthenticated(true)
                } else {
                setUser(null)
                setIsAuthenticated(false)
                }
            } catch (error) {
                setUser(null)
                setIsAuthenticated(false)
            }
            }

            fetchUser()
        }, [])

    return (
        <Router>
        <div className="min-h-screen">
            <Navigation user={user} isAuthenticated={isAuthenticated} />
            <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/crop-prediction" element={<CropPrediction />} />
            <Route path="/disease-prediction" element={<DiseasePrediction />} />
            <Route path="/fertilizer" element={<Fertilizer />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            </Routes>
        </div>
        </Router>
    );
}

export default App;
