import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

function Dashboard({ user }) {
    const { t } = useTranslation();
    const [stats, setStats] = useState({ total: 0, crop: 0, disease: 0, fertilizer: 0 });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
        const response = await axios.get(`${BACKEND_URL}/api/stats`, { withCredentials: true });
        setStats(response.data);
        } catch (error) {
        console.error('Error fetching stats:', error);
        }
    };

    const features = [
        {
        title: t('dashboard.featureCropTitle'),
        description: t('dashboard.featureCropDesc'),
        icon: '🌾',
        link: '/crop-prediction',
        color: 'from-green-400 to-emerald-500',
        colorLight: 'from-green-50 to-emerald-50',
        iconBg: 'bg-green-100',
        testId: 'dashboard-crop-card'
        },
        {
        title: t('dashboard.featureDiseaseTitle'),
        description: t('dashboard.featureDiseaseDesc'),
        icon: '🔬',
        link: '/disease-prediction',
        color: 'from-blue-400 to-cyan-500',
        colorLight: 'from-blue-50 to-cyan-50',
        iconBg: 'bg-blue-100',
        testId: 'dashboard-disease-card'
        },
        {
        title: t('dashboard.featureFertilizerTitle'),
        description: t('dashboard.featureFertilizerDesc'),
        icon: '🧪',
        link: '/fertilizer',
        color: 'from-purple-400 to-pink-500',
        colorLight: 'from-purple-50 to-pink-50',
        iconBg: 'bg-purple-100',
        testId: 'dashboard-fertilizer-card'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-slate-900 dark:to-slate-800">
        {/* Hero Section */}
        <div className="container mx-auto px-6 py-16">
            <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-orange-500 bg-clip-text text-transparent mb-6 dark:from-green-400 dark:via-emerald-400 dark:to-orange-400" data-testid="dashboard-title">
                {t('dashboard.titlePart1')} <span>{t('nav.brand')}</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8" data-testid="dashboard-subtitle">
                {user ? t('dashboard.greeting', { name: user.name || user.email }) : t('dashboard.subtitlePlain')}
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-6 transform hover:scale-105 transition-all hover:shadow-xl hover:shadow-green-200 dark:hover:shadow-green-900/30">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent" data-testid="stat-total">{stats.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('dashboard.statsTotal')}</div>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-6 transform hover:scale-105 transition-all hover:shadow-xl hover:shadow-orange-200 dark:hover:shadow-orange-900/30">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent" data-testid="stat-crop">{stats.crop}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('dashboard.statsCrop')}</div>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-6 transform hover:scale-105 transition-all hover:shadow-xl hover:shadow-blue-200 dark:hover:shadow-blue-900/30">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent" data-testid="stat-disease">{stats.disease}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('dashboard.statsDisease')}</div>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-md p-6 transform hover:scale-105 transition-all hover:shadow-xl hover:shadow-purple-200 dark:hover:shadow-purple-900/30">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="stat-fertilizer">{stats.fertilizer}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('dashboard.statsFertilizer')}</div>
                </div>
            </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
                <Link
                key={index}
                to={feature.link}
                className="group card-hover animate-fade-in"
                data-testid={feature.testId}
                style={{ animationDelay: `${index * 0.1}s` }}
                >
                <div className={`bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-lg p-8 h-full bg-gradient-to-br ${feature.colorLight} dark:from-slate-700/50 dark:to-slate-600/50 border border-white/50 dark:border-slate-700/50 glow-effect`}>
                    <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-3xl mb-6 group-hover:rotate-6 transition-transform shadow-lg animate-pulse-glow`}>
                    {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{feature.description}</p>
                    <div className="flex items-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400 font-semibold group-hover:translate-x-2 transition-transform">
                    {t('dashboard.getStarted')}
                    <svg className="w-5 h-5 ml-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    </div>
                </div>
                </Link>
            ))}
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-8 text-center">{t('dashboard.whyChoose')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2">{t('dashboard.benefit1Title')}</h3>
                <p className="text-green-100">{t('dashboard.benefit1Desc')}</p>
                </div>
                <div className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2">{t('dashboard.benefit2Title')}</h3>
                <p className="text-green-100">{t('dashboard.benefit2Desc')}</p>
                </div>
                <div className="text-center">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-semibold mb-2">{t('dashboard.benefit3Title')}</h3>
                <p className="text-green-100">{t('dashboard.benefit3Desc')}</p>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}

export default Dashboard;