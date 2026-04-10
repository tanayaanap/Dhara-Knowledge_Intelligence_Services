import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function Dashboard() {
    const [stats, setStats] = useState({ total: 0, crop: 0, disease: 0, fertilizer: 0 });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
        const response = await axios.get(`${BACKEND_URL}/api/stats`);
        setStats(response.data);
        } catch (error) {
        console.error('Error fetching stats:', error);
        }
    };

    const features = [
        {
        title: 'Crop Prediction',
        description: 'Get AI-powered recommendations for the best crops to grow based on your soil and climate conditions.',
        icon: '🌾',
        link: '/crop-prediction',
        color: 'from-green-400 to-emerald-500',
        testId: 'dashboard-crop-card'
        },
        {
        title: 'Disease Prediction',
        description: 'Early detection of crop diseases using advanced AI algorithms to protect your harvest.',
        icon: '🔬',
        link: '/disease-prediction',
        color: 'from-blue-400 to-cyan-500',
        testId: 'dashboard-disease-card'
        },
        {
        title: 'Fertilizer Recommendation',
        description: 'Optimize your fertilizer usage with personalized recommendations for better yields.',
        icon: '🧪',
        link: '/fertilizer',
        color: 'from-purple-400 to-pink-500',
        testId: 'dashboard-fertilizer-card'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-16">
            <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6" data-testid="dashboard-title">
                Welcome to <span className="text-green-600">DharaAI</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8" data-testid="dashboard-subtitle">
                Empowering farmers with artificial intelligence for smarter, sustainable agriculture
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
                <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform">
                <div className="text-3xl font-bold text-green-600" data-testid="stat-total">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Predictions</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform">
                <div className="text-3xl font-bold text-green-600" data-testid="stat-crop">{stats.crop}</div>
                <div className="text-sm text-gray-600">Crop Analysis</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform">
                <div className="text-3xl font-bold text-blue-600" data-testid="stat-disease">{stats.disease}</div>
                <div className="text-sm text-gray-600">Disease Detected</div>
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition-transform">
                <div className="text-3xl font-bold text-purple-600" data-testid="stat-fertilizer">{stats.fertilizer}</div>
                <div className="text-sm text-gray-600">Fertilizer Tips</div>
                </div>
            </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
                <Link
                key={index}
                to={feature.link}
                className="group"
                data-testid={feature.testId}
                >
                <div className="bg-white rounded-2xl shadow-lg p-8 h-full transform group-hover:scale-105 transition-all duration-300 group-hover:shadow-2xl">
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:rotate-6 transition-transform`}>
                    {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">{feature.title}</h3>
                    <p className="text-gray-600 mb-6">{feature.description}</p>
                    <div className="flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
                    Get Started
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    </div>
                </div>
                </Link>
            ))}
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Choose AgriAI?</h2>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">Accurate Predictions</h3>
                <p className="text-green-100">AI-powered analysis for precise farming decisions</p>
                </div>
                <div className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2">Real-time Results</h3>
                <p className="text-green-100">Get instant recommendations for your farm</p>
                </div>
                <div className="text-center">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-semibold mb-2">Increased Yield</h3>
                <p className="text-green-100">Optimize resources for maximum productivity</p>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}

export default Dashboard;